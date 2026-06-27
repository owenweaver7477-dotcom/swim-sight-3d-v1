import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WORKER_POSE_3D_CALLBACK_CONTRACT,
  buildSafePose3DArtifactSummary,
  buildSafePose3DCallbackSummary,
  isPose3DProgressStatus,
  jobStatusForPose3DProgress,
} from '../api/_lib/ai/pose3dCallback.js';
import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(root, 'fixtures', 'ai-callback', 'pose-3d-estimated-callback.sample.json');
const callbackHandler = await readFile(path.join(root, 'api', '_lib', 'ai', 'callbackHandler.js'), 'utf8');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

assert.equal(WORKER_POSE_3D_CALLBACK_CONTRACT.status, 'pose_3d_estimated');
assert.equal(isPose3DProgressStatus('pose_3d_estimated'), true);
assert.equal(jobStatusForPose3DProgress('pose_3d_estimated'), 'running');
assert.match(callbackHandler, /POSE_3D_PROGRESS_STATUSES/);
assert.match(callbackHandler, /pose_3d_summary: next\.pose_3d_summary/);
assert.match(callbackHandler, /mergeCallbackSummary\(job\.callback_summary, safeCallbackSummary/);

const summary = buildSafePose3DCallbackSummary(fixture);
assert.ok(summary, 'pose_3d_estimated should create a safe pose summary');
assert.equal(summary.availabilityState, 'pose_3d_estimated');
assert.equal(summary.ok, true);
assert.equal(summary.source, 'monocular_estimate');
assert.equal(summary.method, 'anatomical_heuristic_lift');
assert.equal(summary.measurementType, 'estimated');
assert.equal(summary.pose3dModel, 'anatomical_heuristic_lift_v1');
assert.equal(summary.inputPoseModel, 'mediapipe_pose');
assert.equal(summary.inputFrames, 213);
assert.equal(summary.estimatedFrames, 184);
assert.equal(summary.partialFrames, 22);
assert.equal(summary.failedFrames, 7);
assert.equal(summary.averageFrameConfidence, 0.68);
assert.equal(summary.coordinateSystem, 'hip_centered_relative');
assert.equal(summary.scale, 'relative_body_units');
assert.equal(summary.calibration.cameraCalibrated, false);
assert.equal(summary.calibration.worldScaleKnown, false);
assert.equal(summary.calibration.multiView, false);
assert.ok(summary.assumptions.join(' ').includes('not measured metres'));

const artifact = buildSafePose3DArtifactSummary(fixture);
assert.ok(artifact, 'pose 3d artifact metadata should be accepted');
assert.equal(artifact.artifact_type, 'pose_3d_timeseries');
assert.equal(artifact.storage_visibility, 'private');
assert.equal(artifact.format, 'json');
assert.equal(artifact.frame_count, 213);
assert.equal(artifact.contains_raw_pose, true);
assert.equal(artifact.contains_video_pixels, false);
assert.equal(artifact.public_safe, false);
assert.equal(artifact.source, 'monocular_estimate');
assert.equal(artifact.measurementType, 'estimated');
assert.equal(artifact.safe_metadata_only, true);

const unsafePayload = {
  ...fixture,
  signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=synthetic',
  pose_3d_frames: [
    {
      joints_3d: {
        left_shoulder: { x: 0.12, y: 1.42, z: -0.08, confidence: 0.76 },
      },
    },
  ],
  pose_2d_frames: [{ joints_2d: { left_shoulder: { x: 0.42, y: 0.31 } } }],
  raw_frames: ['data:image/png;base64,synthetic'],
  force_frames: [{ dragForceEstimate: 42 }],
  estimated_drag: { drag_force_estimate: 42 },
  pose_3d_artifact: {
    ...fixture.pose_3d_artifact,
    local_path: '/Users/synthetic/private-3d-pose.json',
    storage_path: 'private-videos/club/swimmer/private-3d-pose.json',
    signed_url: 'https://example.supabase.co/storage/v1/object/sign/private-3d-pose.json?token=synthetic',
  },
};

const unsafeSummary = buildSafePose3DCallbackSummary(unsafePayload);
const unsafeArtifact = buildSafePose3DArtifactSummary(unsafePayload);
const combined = JSON.stringify({ unsafeSummary, unsafeArtifact });
assert.equal(combined.includes('pose_3d_frames'), false);
assert.equal(combined.includes('joints_3d'), false);
assert.equal(combined.includes('pose_2d_frames'), false);
assert.equal(combined.includes('joints_2d'), false);
assert.equal(combined.includes('raw_frames'), false);
assert.equal(combined.includes('force_frames'), false);
assert.equal(combined.includes('dragForceEstimate'), false);
assert.equal(combined.includes('estimated_drag'), false);
assert.equal(combined.includes('signed_url'), false);
assert.equal(combined.includes('storage_path'), false);
assert.equal(combined.includes('/Users/'), false);
assert.equal(unsafeArtifact.safe_metadata_only, false);

const publicPayload = sanitizePublicReportPayload({
  report: {
    title: 'Pose 3D Safety Report',
    status: 'finalised',
    stroke_type: 'Freestyle',
    analysis_type: 'Technique Review',
    callback_summary: {
      pose_3d_summary: unsafeSummary,
      pose_3d_artifact: unsafeArtifact,
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
assert.equal(JSON.stringify(publicPayload).includes('pose_3d_summary'), false);
assert.equal(JSON.stringify(publicPayload).includes('pose_3d_artifact'), false);
assert.equal(JSON.stringify(publicPayload).includes('private-3d-pose'), false);

console.log('Pose 3D callback check passed.');
