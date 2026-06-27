export const POSE_3D_PROGRESS_STATUSES = Object.freeze(['pose_3d_estimated']);

export const WORKER_POSE_3D_CALLBACK_CONTRACT = Object.freeze({
  job_id: 'string',
  status: 'pose_3d_estimated',
  pose_3d_summary: Object.freeze({
    availabilityState: 'pose_3d_estimated',
    ok: 'boolean',
    source: 'monocular_estimate',
    method: 'anatomical_heuristic_lift',
    measurementType: 'estimated',
    pose3dModel: 'anatomical_heuristic_lift_v1',
    inputPoseModel: 'mediapipe_pose',
    inputFrames: 'number',
    estimatedFrames: 'number',
    partialFrames: 'number',
    failedFrames: 'number',
    averageFrameConfidence: 'number',
    coordinateSystem: 'hip_centered_relative',
    scale: 'relative_body_units',
    calibration: 'object',
    assumptions: 'string[]',
    warnings: 'string[]',
  }),
  pose_3d_artifact: Object.freeze({
    artifact_type: 'pose_3d_timeseries',
    storage_visibility: 'private',
    format: 'json',
    frame_count: 'number',
    contains_raw_pose: 'boolean',
    contains_video_pixels: 'boolean',
    public_safe: 'boolean',
    source: 'monocular_estimate',
    measurementType: 'estimated',
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

function normaliseArray(value, limit = 50) {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string').slice(0, limit);
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean).slice(0, limit);
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

function safeText(value, fallback = null, maxLength = 160) {
  if (value == null) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  return text.slice(0, maxLength);
}

function safeCalibration(value = {}) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    cameraCalibrated: input.cameraCalibrated === true,
    worldScaleKnown: input.worldScaleKnown === true,
    multiView: input.multiView === true,
  };
}

export function isPose3DProgressStatus(status) {
  return POSE_3D_PROGRESS_STATUSES.includes(String(status || '').toLowerCase());
}

export function jobStatusForPose3DProgress(status) {
  return isPose3DProgressStatus(status) ? 'running' : String(status || 'running').toLowerCase();
}

export function buildSafePose3DCallbackSummary(payload = {}) {
  const raw = payload.pose_3d_summary && typeof payload.pose_3d_summary === 'object'
    ? payload.pose_3d_summary
    : {};
  if (!Object.keys(raw).length) return null;

  return {
    availabilityState: 'pose_3d_estimated',
    ok: raw.ok === true,
    source: 'monocular_estimate',
    method: safeText(raw.method, 'anatomical_heuristic_lift'),
    measurementType: 'estimated',
    pose3dModel: safeText(raw.pose3dModel, 'anatomical_heuristic_lift_v1'),
    inputPoseModel: safeText(raw.inputPoseModel, 'mediapipe_pose'),
    inputFrames: boundedNumber(raw.inputFrames),
    estimatedFrames: boundedNumber(raw.estimatedFrames),
    partialFrames: boundedNumber(raw.partialFrames),
    failedFrames: boundedNumber(raw.failedFrames),
    averageFrameConfidence: boundedRatio(raw.averageFrameConfidence),
    coordinateSystem: safeText(raw.coordinateSystem, 'hip_centered_relative'),
    scale: safeText(raw.scale, 'relative_body_units'),
    calibration: safeCalibration(raw.calibration),
    assumptions: normaliseArray(raw.assumptions, 12),
    warnings: normaliseArray(raw.warnings),
  };
}

export function buildSafePose3DArtifactSummary(payload = {}) {
  const raw = payload.pose_3d_artifact && typeof payload.pose_3d_artifact === 'object'
    ? payload.pose_3d_artifact
    : {};
  if (!Object.keys(raw).length) return null;

  const containsUnsafeKey = Object.keys(raw).some(key => UNSAFE_ARTIFACT_KEYS.has(key));
  return {
    artifact_type: safeText(raw.artifact_type, 'pose_3d_timeseries'),
    artifact_id: safeText(raw.artifact_id),
    storage_visibility: 'private',
    format: raw.format === 'json' ? 'json' : safeText(raw.format, 'json', 20),
    frame_count: boundedNumber(raw.frame_count),
    contains_raw_pose: raw.contains_raw_pose === true,
    contains_video_pixels: raw.contains_video_pixels === true,
    public_safe: false,
    source: 'monocular_estimate',
    measurementType: 'estimated',
    safe_metadata_only: !containsUnsafeKey,
  };
}
