export const POSE_2D_PROGRESS_STATUSES = Object.freeze(['pose_2d_ready']);

export const WORKER_POSE_2D_CALLBACK_CONTRACT = Object.freeze({
  job_id: 'string',
  status: 'pose_2d_ready',
  pose_2d_summary: Object.freeze({
    availabilityState: 'pose_2d_ready',
    ok: 'boolean',
    model: 'mediapipe_pose',
    modelVersion: 'string|null',
    sampledFrames: 'number',
    processedFrames: 'number',
    trackedFrames: 'number',
    partialFrames: 'number',
    failedFrames: 'number',
    averageFrameConfidence: 'number',
    lowConfidenceJointRate: 'number',
    viewType: 'string',
    warnings: 'string[]',
  }),
  pose_artifact: Object.freeze({
    artifact_type: 'pose_2d_timeseries',
    storage_visibility: 'private',
    format: 'json',
    frame_count: 'number',
    contains_raw_pose: 'boolean',
    contains_video_pixels: 'boolean',
    public_safe: 'boolean',
  }),
});

const UNSAFE_ARTIFACT_KEYS = new Set([
  'path',
  'file_path',
  'filePath',
  'local_path',
  'localPath',
  'storage_path',
  'storagePath',
  'signed_url',
  'signedUrl',
  'url',
  'public_url',
  'publicUrl',
]);

function normaliseArray(value) {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').slice(0, 50);
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean).slice(0, 50);
  return [];
}

function boundedNumber(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, number);
}

function boundedRatio(value, fallback = 0) {
  return Math.max(0, Math.min(1, boundedNumber(value, fallback)));
}

function safeText(value, fallback = null, maxLength = 120) {
  if (value == null) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  return text.slice(0, maxLength);
}

export function isPose2DProgressStatus(status) {
  return POSE_2D_PROGRESS_STATUSES.includes(String(status || '').toLowerCase());
}

export function jobStatusForPose2DProgress(status) {
  return isPose2DProgressStatus(status) ? 'running' : String(status || 'running').toLowerCase();
}

export function buildSafePose2DCallbackSummary(payload = {}) {
  const raw = payload.pose_2d_summary && typeof payload.pose_2d_summary === 'object'
    ? payload.pose_2d_summary
    : {};
  if (!Object.keys(raw).length) return null;

  return {
    availabilityState: 'pose_2d_ready',
    ok: raw.ok === true,
    model: safeText(raw.model, 'mediapipe_pose'),
    modelVersion: safeText(raw.modelVersion),
    sampledFrames: boundedNumber(raw.sampledFrames),
    processedFrames: boundedNumber(raw.processedFrames),
    trackedFrames: boundedNumber(raw.trackedFrames),
    partialFrames: boundedNumber(raw.partialFrames),
    failedFrames: boundedNumber(raw.failedFrames),
    averageFrameConfidence: boundedRatio(raw.averageFrameConfidence),
    lowConfidenceJointRate: boundedRatio(raw.lowConfidenceJointRate),
    viewType: safeText(raw.viewType, 'unknown'),
    warnings: normaliseArray(raw.warnings),
  };
}

export function buildSafePose2DArtifactSummary(payload = {}) {
  const raw = payload.pose_artifact && typeof payload.pose_artifact === 'object'
    ? payload.pose_artifact
    : {};
  if (!Object.keys(raw).length) return null;

  const containsUnsafeKey = Object.keys(raw).some(key => UNSAFE_ARTIFACT_KEYS.has(key));
  return {
    artifact_type: safeText(raw.artifact_type, 'pose_2d_timeseries'),
    artifact_id: safeText(raw.artifact_id),
    storage_visibility: raw.storage_visibility === 'private' ? 'private' : 'private',
    format: raw.format === 'json' ? 'json' : safeText(raw.format, 'json', 20),
    frame_count: boundedNumber(raw.frame_count),
    contains_raw_pose: raw.contains_raw_pose === true,
    contains_video_pixels: raw.contains_video_pixels === true,
    public_safe: false,
    safe_metadata_only: !containsUnsafeKey,
  };
}
