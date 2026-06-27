import assert from 'node:assert/strict';

import {
  createAnalysisPayloadSummary,
  createBiomechanicsSummary,
  createForceEstimate,
  createForceSummary,
  createPoseSummary,
  createVideoMetadata,
  getAnalysisAvailabilityState,
  getCoachReportSafety,
  getPublicSharedReportSafety,
  is2DPoseAvailable,
  is3DPoseAvailable,
  isSafeToShowInCoachReports,
  isSafeToShowInPublicSharedReports,
  validateConfidenceLevel,
  validateForceEstimate,
  validateSourceLabel,
} from '../src/lib/biomechanics/index.js';

const emptyPayload = createAnalysisPayloadSummary();

assert.equal(emptyPayload.schemaVersion, 'swim_sight_biomechanics_v1');
assert.equal(emptyPayload.availabilityState, 'not_started');
assert.deepEqual(createVideoMetadata().warnings, []);
assert.equal(createPoseSummary().pose2dFrameCount, 0);
assert.equal(createBiomechanicsSummary().metricsAvailable, false);
assert.equal(createForceSummary().forceEstimatesAvailable, false);
assert.equal(is2DPoseAvailable(emptyPayload), false);
assert.equal(is3DPoseAvailable(emptyPayload), false);
assert.equal(getAnalysisAvailabilityState(emptyPayload), 'not_started');

assert.equal(validateConfidenceLevel('elite').ok, false);
assert.match(validateConfidenceLevel('elite').errors.join(' '), /confidence/);
assert.equal(validateSourceLabel('magic_camera').ok, false);
assert.match(validateSourceLabel('magic_camera').errors.join(' '), /source/);

const measuredDragEstimate = createForceEstimate({
  value: 42.1,
  unit: 'N',
  estimateType: 'hydrodynamic',
  measurementType: 'measured',
  confidence: 'moderate',
  assumptions: ['Synthetic test only'],
});
const measuredDragValidation = validateForceEstimate(measuredDragEstimate, 'dragForceEstimate');
assert.equal(measuredDragValidation.ok, false);
assert.match(measuredDragValidation.errors.join(' '), /must not be marked as measured/);

const summaryOnlyPayload = createAnalysisPayloadSummary({
  availabilityState: 'biomechanics_ready',
  poseSummary: createPoseSummary({
    pose2dFrameCount: 120,
    pose3dFrameCount: 90,
    pose3dSource: 'monocular_estimate',
    confidence: 'moderate',
  }),
  biomechanicsSummary: createBiomechanicsSummary({
    metricsAvailable: true,
    metricCount: 6,
    confidence: 'moderate',
    summaryMetrics: {
      bodyLine: { label: 'Body line', displayValue: 'Coach-reviewed summary' },
    },
  }),
});

assert.equal(isSafeToShowInCoachReports(summaryOnlyPayload), true);
assert.equal(getCoachReportSafety(summaryOnlyPayload).ok, true);

const coachUnsafePayload = {
  ...summaryOnlyPayload,
  signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/test.mp4?token=synthetic',
};
const coachSafety = getCoachReportSafety(coachUnsafePayload);
assert.equal(coachSafety.ok, false);
assert.match(coachSafety.errors.join(' '), /signed|private/i);

const publicUnsafePayload = {
  ...summaryOnlyPayload,
  pose2dFrames: [
    {
      frameIndex: 1,
      timestampMs: 33,
      landmarks: {
        left_hip: { x: 0.5, y: 0.5, confidence: 0.9 },
      },
    },
  ],
  artifacts: [
    {
      kind: 'pose_2d_json',
      storageBucket: 'private-videos',
      storagePath: 'club/swimmer/private-pose.json',
      publicSafe: false,
    },
  ],
};
const publicSafety = getPublicSharedReportSafety(publicUnsafePayload);
assert.equal(publicSafety.ok, false);
assert.match(publicSafety.errors.join(' '), /pose2dFrames|landmarks|storagePath/);
assert.equal(isSafeToShowInPublicSharedReports(publicUnsafePayload), false);

const publicSafePayload = {
  ...summaryOnlyPayload,
  artifacts: [],
};
assert.equal(isSafeToShowInPublicSharedReports(publicSafePayload), true);

console.log('Biomechanics contract check passed.');
