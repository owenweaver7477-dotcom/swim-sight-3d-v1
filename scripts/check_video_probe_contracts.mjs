import assert from 'node:assert/strict';

import {
  buildFrameSamplingPlan,
  buildMetadataAnalysisPayloadSummary,
  buildVideoProbeSummary,
  getAnalysisAvailabilityState,
  getCoachReportSafety,
  getPublicSharedReportSafety,
  normaliseVideoMetadata,
} from '../src/lib/biomechanics/index.js';

const validProbe = normaliseVideoMetadata({
  videoId: 'synthetic-video-001',
  durationSeconds: 24,
  fps: 60,
  width: 1920,
  height: 1080,
  codec: 'h264',
  name: 'synthetic-breaststroke-side.mp4',
  size: 146.2 * 1024 * 1024,
});

assert.equal(validProbe.ok, true);
assert.equal(validProbe.availabilityState, 'metadata_ready');
assert.equal(validProbe.metadata.metadataComplete, true);
assert.equal(validProbe.metadata.aspectRatio, 1.7778);
assert.equal(validProbe.metadata.containerType, 'mp4');
assert.equal(validProbe.metadata.orientation, 'landscape');

const validSampling = buildFrameSamplingPlan(validProbe.metadata, {
  samplingRateFps: 5,
  maxSampledFrames: 200,
});

assert.equal(validSampling.ok, true);
assert.equal(validSampling.availabilityState, 'frames_sampled');
assert.equal(validSampling.totalSampledFrames, 120);
assert.equal(validSampling.samples[0].sampleIndex, 0);
assert.equal(validSampling.samples[0].sourceFrameIndex, 0);
assert.equal(validSampling.samples[1].timestampMs, 200);
assert.equal(validSampling.samples[1].sourceFrameIndex, 12);
assert.equal(validSampling.samples.every((sample) => sample.status === 'scheduled'), true);

const unknownFpsProbe = normaliseVideoMetadata({
  durationSeconds: 2.4,
  width: 1280,
  height: 720,
});
assert.equal(unknownFpsProbe.ok, true);
assert.ok(unknownFpsProbe.warnings.includes('fps_unavailable'));
const unknownFpsSampling = buildFrameSamplingPlan(unknownFpsProbe.metadata, {
  samplingRateFps: 5,
  maxSampledFrames: 20,
});
assert.equal(unknownFpsSampling.ok, true);
assert.ok(unknownFpsSampling.warnings.includes('source_fps_unknown'));
assert.equal(unknownFpsSampling.samples[1].timestampMs, 200);
assert.equal(unknownFpsSampling.samples[1].sourceFrameIndex, null);

const shortVideoSampling = buildFrameSamplingPlan({
  durationSeconds: 0.4,
  fps: 240,
  width: 1920,
  height: 1080,
}, {
  samplingRateFps: 5,
  maxSampledFrames: 20,
});
assert.equal(shortVideoSampling.ok, true);
assert.equal(shortVideoSampling.totalSampledFrames, 2);
assert.ok(shortVideoSampling.warnings.includes('short_video_under_one_second'));

const longVideoSampling = buildFrameSamplingPlan({
  durationSeconds: 600,
  fps: 120,
  width: 1920,
  height: 1080,
}, {
  samplingRateFps: 5,
  maxSampledFrames: 100,
});
assert.equal(longVideoSampling.ok, true);
assert.equal(longVideoSampling.capped, true);
assert.equal(longVideoSampling.totalSampledFrames, 100);
assert.ok(longVideoSampling.warnings.includes('sample_count_capped'));

const invalidProbe = normaliseVideoMetadata({
  durationSeconds: -12,
  fps: 0,
  width: 0,
  height: 720,
});
assert.equal(invalidProbe.ok, false);
assert.equal(invalidProbe.availabilityState, 'failed');
assert.ok(invalidProbe.errors.includes('duration_required_for_sampling') === false);
assert.ok(invalidProbe.errors.includes('duration_unavailable') === false);
assert.ok(invalidProbe.warnings.includes('duration_unavailable'));

const invalidSampling = buildFrameSamplingPlan(invalidProbe.metadata);
assert.equal(invalidSampling.ok, false);
assert.ok(invalidSampling.errors.includes('duration_required_for_sampling'));

const summary = buildVideoProbeSummary({
  durationSeconds: 10,
  fps: 30,
  width: 1280,
  height: 720,
  file_size_mb: 44,
}, {
  samplingRateFps: 5,
  maxSampledFrames: 80,
});
assert.equal(summary.ok, true);
assert.equal(summary.availabilityState, 'frames_sampled');
assert.equal(summary.frameSampling.totalSampledFrames, 50);

const payloadSummary = buildMetadataAnalysisPayloadSummary({
  durationSeconds: 10,
  fps: 60,
  width: 1920,
  height: 1080,
}, {
  samplingRateFps: 5,
  maxSampledFrames: 100,
});
assert.equal(getAnalysisAvailabilityState(payloadSummary), 'frames_sampled');
assert.equal(payloadSummary.poseSummary.pose2dFrameCount, 0);
assert.equal(payloadSummary.poseSummary.pose3dFrameCount, 0);
assert.equal(payloadSummary.forceSummary.forceEstimatesAvailable, false);
assert.equal(payloadSummary.forceSummary.dragForceEstimate.value, null);
assert.equal(payloadSummary.forceSummary.dragForceEstimate.measurementType, 'not_available');

const publicUnsafe = {
  ...payloadSummary,
  signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/example.mp4?token=synthetic',
  artifacts: [
    {
      storageBucket: 'private-videos',
      storagePath: 'club/swimmer/private-video.mp4',
    },
  ],
};
assert.equal(getPublicSharedReportSafety(publicUnsafe).ok, false);
assert.equal(getCoachReportSafety(publicUnsafe).ok, false);

const publicSafeSummary = {
  ...payloadSummary,
  sampledFrames: [],
  artifacts: [],
};
assert.equal(getPublicSharedReportSafety(publicSafeSummary).ok, true);

assert.equal(JSON.stringify(payloadSummary).includes('pose2dFrames'), false);
assert.equal(JSON.stringify(payloadSummary).includes('pose3dFrames'), false);
assert.equal(JSON.stringify(payloadSummary).includes('dragForceEstimate":42'), false);

console.log('Video probe contract check passed.');
