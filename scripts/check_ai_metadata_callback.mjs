import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WORKER_METADATA_CALLBACK_CONTRACT,
  buildSafeVideoProbeCallbackSummary,
  isMetadataProgressStatus,
  jobStatusForMetadataProgress,
} from '../api/_lib/ai/metadataCallback.js';
import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(root, 'fixtures', 'ai-callback', 'metadata-callback.sample.json');
const callbackHandler = await readFile(path.join(root, 'api', '_lib', 'ai', 'callbackHandler.js'), 'utf8');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

assert.equal(WORKER_METADATA_CALLBACK_CONTRACT.status, 'metadata_ready|frames_sampled');
assert.equal(isMetadataProgressStatus('metadata_ready'), true);
assert.equal(isMetadataProgressStatus('frames_sampled'), true);
assert.equal(jobStatusForMetadataProgress('metadata_ready'), 'extracting_frames');
assert.match(callbackHandler, /METADATA_PROGRESS_STATUSES/);
assert.match(callbackHandler, /callback_summary: progressSummary/);

const summary = buildSafeVideoProbeCallbackSummary(fixture);
assert.ok(summary, 'metadata callback should create a video_probe_summary');
assert.equal(summary.ok, true);
assert.equal(summary.availabilityState, 'frames_sampled');
assert.equal(summary.videoMetadata.durationSeconds, 42.5);
assert.equal(summary.videoMetadata.fps, 60);
assert.equal(summary.videoMetadata.frameCount, 2550);
assert.equal(summary.videoMetadata.width, 1920);
assert.equal(summary.videoMetadata.height, 1080);
assert.equal(summary.videoMetadata.codec, 'h264');
assert.equal(summary.videoMetadata.containerType, 'mp4');
assert.equal(summary.videoMetadata.orientation, 'landscape');
assert.equal(summary.frameSampling.samplingRateFps, 5);
assert.equal(summary.frameSampling.maxSampledFrames, 300);
assert.equal(summary.frameSampling.totalSampledFrames, 213);
assert.equal(summary.frameSampling.samples[1].timestampMs, 200);
assert.equal(summary.frameSampling.samples[1].sourceFrameIndex, 12);

const unknownFpsSummary = buildSafeVideoProbeCallbackSummary({
  ...fixture,
  video_metadata: {
    duration_seconds: 2,
    width: 1280,
    height: 720,
    container: 'mp4',
  },
});
assert.equal(unknownFpsSummary.ok, true);
assert.ok(unknownFpsSummary.warnings.includes('fps_unavailable'));
assert.ok(unknownFpsSummary.frameSampling.warnings.includes('source_fps_unknown'));
assert.equal(unknownFpsSummary.frameSampling.samples[1].sourceFrameIndex, null);

const invalidSummary = buildSafeVideoProbeCallbackSummary({
  ...fixture,
  video_metadata: {
    duration_seconds: -2,
    fps: 0,
    width: 0,
    height: 720,
  },
});
assert.equal(invalidSummary.ok, false);
assert.ok(invalidSummary.errors.includes('invalid_duration'));
assert.ok(invalidSummary.errors.includes('invalid_fps'));
assert.ok(invalidSummary.errors.includes('duration_required_for_sampling'));

const unsafePayloadSummary = buildSafeVideoProbeCallbackSummary({
  ...fixture,
  signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=synthetic',
  file_path: 'private-videos/club/swimmer/private.mp4',
  storage_path: '/Users/synthetic/private.mp4',
  raw_frames: ['data:image/png;base64,synthetic'],
  pose_results: [{ landmarks: { left_hip: { x: 0.1, y: 0.2 } } }],
  force_frames: [{ dragForceEstimate: 42 }],
  video_metadata: {
    ...fixture.video_metadata,
    signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=synthetic',
    storage_path: 'club/swimmer/private.mp4',
  },
  frame_sampling: {
    ...fixture.frame_sampling,
    samples: [{ raw_image_data: 'data:image/png;base64,synthetic' }],
  },
});
const unsafeSummaryJson = JSON.stringify(unsafePayloadSummary);
assert.equal(unsafeSummaryJson.includes('signed_video_url'), false);
assert.equal(unsafeSummaryJson.includes('storage_path'), false);
assert.equal(unsafeSummaryJson.includes('raw_frames'), false);
assert.equal(unsafeSummaryJson.includes('raw_image_data'), false);
assert.equal(unsafeSummaryJson.includes('pose_results'), false);
assert.equal(unsafeSummaryJson.includes('force_frames'), false);
assert.equal(unsafeSummaryJson.includes('dragForceEstimate'), false);
assert.equal(unsafeSummaryJson.includes('private-videos'), false);

const publicPayload = sanitizePublicReportPayload({
  report: {
    title: 'Metadata Probe Report',
    status: 'finalised',
    stroke_type: 'Freestyle',
    analysis_type: 'Technique Review',
    callback_summary: {
      video_probe_summary: unsafePayloadSummary,
    },
  },
  video_meta: {
    stroke_type: 'Freestyle',
    analysis_type: 'Technique Review',
  },
  findings: [],
  annotations: [],
});
assert.deepEqual(findUnsafePublicReportPaths(publicPayload), []);
assert.equal(JSON.stringify(publicPayload).includes('video_probe_summary'), false);
assert.equal(JSON.stringify(publicPayload).includes('private-videos'), false);

console.log('AI metadata callback check passed.');
