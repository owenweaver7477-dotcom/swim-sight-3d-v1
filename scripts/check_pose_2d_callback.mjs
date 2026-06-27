import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WORKER_POSE_2D_CALLBACK_CONTRACT,
  buildSafePose2DArtifactSummary,
  buildSafePose2DCallbackSummary,
  isPose2DProgressStatus,
  jobStatusForPose2DProgress,
} from '../api/_lib/ai/pose2dCallback.js';
import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(root, 'fixtures', 'ai-callback', 'pose-2d-callback.sample.json');
const callbackHandler = await readFile(path.join(root, 'api', '_lib', 'ai', 'callbackHandler.js'), 'utf8');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

assert.equal(WORKER_POSE_2D_CALLBACK_CONTRACT.status, 'pose_2d_ready');
assert.equal(isPose2DProgressStatus('pose_2d_ready'), true);
assert.equal(jobStatusForPose2DProgress('pose_2d_ready'), 'running');
assert.match(callbackHandler, /POSE_2D_PROGRESS_STATUSES/);
assert.match(callbackHandler, /pose_2d_summary: next\.pose_2d_summary/);
assert.match(callbackHandler, /mergeCallbackSummary\(existingSummary, progressDelta\)/);
assert.match(callbackHandler, /mergeCallbackSummary\(job\.callback_summary, safeCallbackSummary/);

const summary = buildSafePose2DCallbackSummary(fixture);
assert.ok(summary, 'pose_2d_ready should create a safe pose summary');
assert.equal(summary.availabilityState, 'pose_2d_ready');
assert.equal(summary.ok, true);
assert.equal(summary.model, 'mediapipe_pose');
assert.equal(summary.modelVersion, 'blazepose_33');
assert.equal(summary.sampledFrames, 213);
assert.equal(summary.processedFrames, 213);
assert.equal(summary.trackedFrames, 184);
assert.equal(summary.partialFrames, 22);
assert.equal(summary.failedFrames, 7);
assert.equal(summary.averageFrameConfidence, 0.74);
assert.equal(summary.lowConfidenceJointRate, 0.18);
assert.equal(summary.viewType, 'side');

const artifact = buildSafePose2DArtifactSummary(fixture);
assert.ok(artifact, 'pose artifact metadata should be accepted');
assert.equal(artifact.artifact_type, 'pose_2d_timeseries');
assert.equal(artifact.storage_visibility, 'private');
assert.equal(artifact.format, 'json');
assert.equal(artifact.frame_count, 213);
assert.equal(artifact.contains_raw_pose, true);
assert.equal(artifact.contains_video_pixels, false);
assert.equal(artifact.public_safe, false);
assert.equal(artifact.safe_metadata_only, true);

const unsafePayload = {
  ...fixture,
  signed_video_url: 'https://example.supabase.co/storage/v1/object/sign/private-videos/private.mp4?token=synthetic',
  pose_2d_frames: [
    {
      joints_2d: {
        left_shoulder: { x: 0.42, y: 0.31, confidence: 0.91 },
      },
    },
  ],
  raw_frames: ['data:image/png;base64,synthetic'],
  joints_3d: [{ left_shoulder: [0, 0, 0] }],
  estimated_drag: { drag_force_estimate: 42 },
  pose_artifact: {
    ...fixture.pose_artifact,
    local_path: '/Users/synthetic/private-pose.json',
    storage_path: 'private-videos/club/swimmer/private-pose.json',
    signed_url: 'https://example.supabase.co/storage/v1/object/sign/private-pose.json?token=synthetic',
  },
};

const unsafeSummary = buildSafePose2DCallbackSummary(unsafePayload);
const unsafeArtifact = buildSafePose2DArtifactSummary(unsafePayload);
const combined = JSON.stringify({ unsafeSummary, unsafeArtifact });
assert.equal(combined.includes('pose_2d_frames'), false);
assert.equal(combined.includes('joints_2d'), false);
assert.equal(combined.includes('raw_frames'), false);
assert.equal(combined.includes('joints_3d'), false);
assert.equal(combined.includes('estimated_drag'), false);
assert.equal(combined.includes('signed_url'), false);
assert.equal(combined.includes('storage_path'), false);
assert.equal(combined.includes('/Users/'), false);
assert.equal(unsafeArtifact.safe_metadata_only, false);

const publicPayload = sanitizePublicReportPayload({
  report: {
    title: 'Pose 2D Safety Report',
    status: 'finalised',
    stroke_type: 'Freestyle',
    analysis_type: 'Technique Review',
    callback_summary: {
      pose_2d_summary: unsafeSummary,
      pose_artifact: unsafeArtifact,
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
assert.equal(JSON.stringify(publicPayload).includes('pose_2d_summary'), false);
assert.equal(JSON.stringify(publicPayload).includes('pose_artifact'), false);
assert.equal(JSON.stringify(publicPayload).includes('private-pose'), false);

console.log('Pose 2D callback check passed.');
