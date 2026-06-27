import {
  AVAILABILITY_STATES,
  COACH_DECISIONS,
  CONFIDENCE_LEVELS,
  MEASUREMENT_TYPES,
  POSE_3D_SOURCES,
  SOURCE_LABELS,
} from './contracts.js';

const PRIVATE_VALUE_PATTERN = /(signed[_-]?url|token=|private:\/\/|\/Users\/|\/home\/|\/var\/folders\/|supabase\.co\/storage|callback_url|service_role|webhook_secret)/i;

const COACH_BLOCKED_KEYS = new Set([
  'signed_url',
  'signedUrl',
  'signed_video_url',
  'signedVideoUrl',
  'callback_url',
  'callbackUrl',
  'file_uri',
  'fileUri',
  'file_path',
  'filePath',
  'storage_path',
  'storagePath',
  'private_path',
  'privatePath',
  'raw_frames',
  'rawFrames',
  'frame_arrays',
  'frameArrays',
  'raw_landmarks',
  'rawLandmarks',
  'pose_results',
  'poseResults',
]);

const PUBLIC_BLOCKED_KEYS = new Set([
  ...COACH_BLOCKED_KEYS,
  'landmarks',
  'joints_2d',
  'joints2d',
  'joints3d',
  'joints_3d',
  'pose2dFrames',
  'pose_2d_frames',
  'pose3dFrames',
  'pose_3d_frames',
  'sampledFrames',
  'sampled_frames',
  'raw_ai_payload',
  'rawAiPayload',
  'athlete_profile_inputs',
  'athleteProfileInputs',
  'body_mass_kg',
  'bodyMassKg',
  'swimmer_mass_kg',
  'swimmerMassKg',
  'height_cm',
  'heightCm',
  'approximate_height_cm',
  'approximateHeightCm',
  'calibration_config',
  'calibrationConfig',
  'debug',
  'internal',
]);

function result(errors) {
  return { ok: errors.length === 0, errors };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addEnumError(errors, value, allowed, label) {
  if (!allowed.includes(value)) {
    errors.push(`${label} must be one of: ${allowed.join(', ')}`);
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateTimestampRange(value, label, errors) {
  if (value == null) return;
  if (!Array.isArray(value) || value.length !== 2 || !value.every(isFiniteNumber)) {
    errors.push(`${label} must be a two-number [startMs, endMs] range when provided`);
  }
}

export function validateConfidenceLevel(value) {
  const errors = [];
  addEnumError(errors, value, CONFIDENCE_LEVELS, 'confidence');
  return result(errors);
}

export function validateSourceLabel(value) {
  const errors = [];
  addEnumError(errors, value, SOURCE_LABELS, 'source');
  return result(errors);
}

export function validateMeasurementType(value) {
  const errors = [];
  addEnumError(errors, value, MEASUREMENT_TYPES, 'measurementType');
  return result(errors);
}

export function validateAvailabilityState(value) {
  const errors = [];
  addEnumError(errors, value, AVAILABILITY_STATES, 'availabilityState');
  return result(errors);
}

export function validateVideoMetadata(metadata = {}) {
  const errors = [];
  if (!isPlainObject(metadata)) return result(['videoMetadata must be an object']);
  ['durationSeconds', 'fps', 'frameCount', 'width', 'height', 'fileSizeMb'].forEach((key) => {
    if (metadata[key] != null && !isFiniteNumber(metadata[key])) errors.push(`${key} must be a number or null`);
  });
  if (metadata.aspectRatio != null && !isFiniteNumber(metadata.aspectRatio)) errors.push('aspectRatio must be a number or null');
  if (typeof metadata.metadataComplete !== 'boolean') errors.push('metadataComplete must be boolean');
  if (metadata.errors != null && !Array.isArray(metadata.errors)) errors.push('errors must be an array');
  if (metadata.source != null) errors.push(...validateSourceLabel(metadata.source).errors);
  if (metadata.warnings != null && !Array.isArray(metadata.warnings)) errors.push('warnings must be an array');
  return result(errors);
}

export function validateSampledVideoFrame(frame = {}) {
  const errors = [];
  if (!isPlainObject(frame)) return result(['sampled frame must be an object']);
  ['frameIndex', 'timestampMs'].forEach((key) => {
    if (!isFiniteNumber(frame[key])) errors.push(`${key} must be a number`);
  });
  if (frame.source !== 'video_metadata') errors.push('sampled frame source must be video_metadata');
  return result(errors);
}

export function validatePose2DLandmark(landmark = {}) {
  const errors = [];
  if (!isPlainObject(landmark)) return result(['2D landmark must be an object']);
  ['x', 'y', 'visibility'].forEach((key) => {
    if (landmark[key] != null && !isFiniteNumber(landmark[key])) errors.push(`${key} must be a number or null`);
  });
  if (!isFiniteNumber(landmark.confidence) || landmark.confidence < 0 || landmark.confidence > 1) {
    errors.push('2D landmark confidence must be a number from 0 to 1');
  }
  if (landmark.source !== 'pose_2d') errors.push('2D landmark source must be pose_2d');
  return result(errors);
}

export function validatePose2DFrame(frame = {}) {
  const errors = [];
  if (!isPlainObject(frame)) return result(['2D pose frame must be an object']);
  ['frameIndex', 'timestampMs', 'keypointCount'].forEach((key) => {
    if (!isFiniteNumber(frame[key])) errors.push(`${key} must be a number`);
  });
  if (typeof frame.poseDetected !== 'boolean') errors.push('poseDetected must be boolean');
  if (typeof frame.reliable !== 'boolean') errors.push('reliable must be boolean');
  errors.push(...validateConfidenceLevel(frame.confidence).errors);
  if (frame.source !== 'pose_2d') errors.push('2D pose frame source must be pose_2d');
  if (!isPlainObject(frame.landmarks)) errors.push('landmarks must be an object');
  return result(errors);
}

export function validatePose3DLandmark(landmark = {}) {
  const errors = [];
  if (!isPlainObject(landmark)) return result(['3D landmark must be an object']);
  ['x', 'y', 'z'].forEach((key) => {
    if (landmark[key] != null && !isFiniteNumber(landmark[key])) errors.push(`${key} must be a number or null`);
  });
  if (!isFiniteNumber(landmark.confidence) || landmark.confidence < 0 || landmark.confidence > 1) {
    errors.push('3D landmark confidence must be a number from 0 to 1');
  }
  addEnumError(errors, landmark.source, POSE_3D_SOURCES, '3D landmark source');
  errors.push(...validateMeasurementType(landmark.measurementType).errors);
  if (landmark.source === 'monocular_estimate' && landmark.measurementType === 'measured') {
    errors.push('monocular 3D landmarks must not be marked as measured');
  }
  return result(errors);
}

export function validatePose3DFrame(frame = {}) {
  const errors = [];
  if (!isPlainObject(frame)) return result(['3D pose frame must be an object']);
  ['frameIndex', 'timestampMs'].forEach((key) => {
    if (!isFiniteNumber(frame[key])) errors.push(`${key} must be a number`);
  });
  addEnumError(errors, frame.source, POSE_3D_SOURCES, '3D frame source');
  errors.push(...validateMeasurementType(frame.measurementType).errors);
  errors.push(...validateConfidenceLevel(frame.confidence).errors);
  if (frame.source === 'monocular_estimate' && frame.measurementType === 'measured') {
    errors.push('single-view 3D frames must be labelled estimated, not measured');
  }
  if (!isPlainObject(frame.joints3d)) errors.push('joints3d must be an object');
  if (frame.source === 'multi_view_triangulated' && frame.cameraCount != null && frame.cameraCount < 2) {
    errors.push('multi-view triangulated frames require at least two cameras when cameraCount is provided');
  }
  return result(errors);
}

export function validateMetricValue(metric = {}, label = 'metric') {
  const errors = [];
  if (!isPlainObject(metric)) return result([`${label} must be an object`]);
  if (metric.value != null && !isFiniteNumber(metric.value)) errors.push(`${label}.value must be a number or null`);
  errors.push(...validateMeasurementType(metric.measurementType).errors);
  errors.push(...validateConfidenceLevel(metric.confidence).errors);
  if (metric.source != null) errors.push(...validateSourceLabel(metric.source).errors);
  validateTimestampRange(metric.timestampRangeMs, `${label}.timestampRangeMs`, errors);
  return result(errors);
}

export function validateBiomechanicalMetrics(metrics = {}) {
  const errors = [];
  if (!isPlainObject(metrics)) return result(['biomechanical metrics must be an object']);
  if (metrics.source !== 'biomechanics_engine') errors.push('biomechanical metrics source must be biomechanics_engine');
  errors.push(...validateConfidenceLevel(metrics.confidence).errors);
  errors.push(...validateMeasurementType(metrics.measurementType).errors);
  validateTimestampRange(metrics.timestampRangeMs, 'biomechanics timestampRangeMs', errors);
  return result(errors);
}

export function validateForceEstimate(estimate = {}, fieldName = 'forceEstimate') {
  const errors = [];
  if (!isPlainObject(estimate)) return result([`${fieldName} must be an object`]);
  if (estimate.value != null && !isFiniteNumber(estimate.value)) errors.push(`${fieldName}.value must be a number or null`);
  errors.push(...validateMeasurementType(estimate.measurementType).errors);
  errors.push(...validateConfidenceLevel(estimate.confidence).errors);
  if (estimate.source !== 'hydrodynamics_engine') errors.push(`${fieldName}.source must be hydrodynamics_engine`);
  if (!Array.isArray(estimate.assumptions)) errors.push(`${fieldName}.assumptions must be an array`);
  validateTimestampRange(estimate.timestampRangeMs, `${fieldName}.timestampRangeMs`, errors);
  if (/estimate/i.test(fieldName) && estimate.measurementType === 'measured') {
    errors.push(`${fieldName} is an estimate field and must not be marked as measured`);
  }
  return result(errors);
}

export function validateForceSummary(summary = {}) {
  const errors = [];
  if (!isPlainObject(summary)) return result(['force summary must be an object']);
  errors.push(...validateMeasurementType(summary.measurementType).errors);
  errors.push(...validateConfidenceLevel(summary.confidence).errors);
  if (summary.source !== 'hydrodynamics_engine') errors.push('force summary source must be hydrodynamics_engine');
  errors.push(...validateForceEstimate(summary.dragForceEstimate, 'dragForceEstimate').errors);
  errors.push(...validateForceEstimate(summary.propulsionTimingEstimate, 'propulsionTimingEstimate').errors);
  if (!Array.isArray(summary.forceLeakageIndicators)) errors.push('forceLeakageIndicators must be an array');
  return result(errors);
}

export function validateStrokePhaseWindow(window = {}) {
  const errors = [];
  if (!isPlainObject(window)) return result(['stroke phase window must be an object']);
  errors.push(...validateConfidenceLevel(window.confidence).errors);
  if (window.source != null) errors.push(...validateSourceLabel(window.source).errors);
  ['startTimestampMs', 'endTimestampMs'].forEach((key) => {
    if (window[key] != null && !isFiniteNumber(window[key])) errors.push(`${key} must be a number or null`);
  });
  if (isFiniteNumber(window.startTimestampMs) && isFiniteNumber(window.endTimestampMs) && window.endTimestampMs < window.startTimestampMs) {
    errors.push('phase endTimestampMs must be after startTimestampMs');
  }
  return result(errors);
}

export function validateAICoachingFinding(finding = {}) {
  const errors = [];
  if (!isPlainObject(finding)) return result(['AI coaching finding must be an object']);
  errors.push(...validateConfidenceLevel(finding.confidence).errors);
  if (finding.source != null) errors.push(...validateSourceLabel(finding.source).errors);
  if (finding.coachReviewRequired !== true) errors.push('AI coaching findings must require coach review');
  ['timestampStartSeconds', 'timestampEndSeconds'].forEach((key) => {
    if (finding[key] != null && !isFiniteNumber(finding[key])) errors.push(`${key} must be a number or null`);
  });
  return result(errors);
}

export function validateCoachApprovalState(state = {}) {
  const errors = [];
  if (!isPlainObject(state)) return result(['coach approval state must be an object']);
  addEnumError(errors, state.decision, COACH_DECISIONS, 'coach approval decision');
  if (state.source !== 'coach_review') errors.push('coach approval source must be coach_review');
  if (typeof state.coachReviewed !== 'boolean') errors.push('coachReviewed must be boolean');
  if (typeof state.publicReportAllowed !== 'boolean') errors.push('publicReportAllowed must be boolean');
  return result(errors);
}

export function validateProcessingArtifactReference(artifact = {}) {
  const errors = [];
  if (!isPlainObject(artifact)) return result(['processing artifact reference must be an object']);
  if (artifact.signedUrl) errors.push('processing artifact references must not include signedUrl');
  if (artifact.publicSafe && (artifact.storagePath || artifact.storageBucket)) {
    errors.push('public-safe artifact references must not expose storageBucket or storagePath');
  }
  return result(errors);
}

export function validateAnalysisPayloadSummary(payload = {}) {
  const errors = [];
  if (!isPlainObject(payload)) return result(['analysis payload summary must be an object']);
  errors.push(...validateAvailabilityState(payload.availabilityState).errors);
  errors.push(...validateVideoMetadata(payload.videoMetadata || {}).errors.map((error) => `videoMetadata.${error}`));
  if (payload.forceSummary) errors.push(...validateForceSummary(payload.forceSummary).errors.map((error) => `forceSummary.${error}`));
  if (payload.coachApproval) errors.push(...validateCoachApprovalState(payload.coachApproval).errors.map((error) => `coachApproval.${error}`));
  (payload.phaseWindows || []).forEach((window, index) => {
    errors.push(...validateStrokePhaseWindow(window).errors.map((error) => `phaseWindows[${index}].${error}`));
  });
  (payload.aiFindings || []).forEach((finding, index) => {
    errors.push(...validateAICoachingFinding(finding).errors.map((error) => `aiFindings[${index}].${error}`));
  });
  (payload.artifacts || []).forEach((artifact, index) => {
    errors.push(...validateProcessingArtifactReference(artifact).errors.map((error) => `artifacts[${index}].${error}`));
  });
  return result(errors);
}

function scanUnsafe(value, {
  mode,
  path = '$',
  errors = [],
  parentKey = '',
} = {}) {
  const blockedKeys = mode === 'public' ? PUBLIC_BLOCKED_KEYS : COACH_BLOCKED_KEYS;

  if (typeof value === 'string' && PRIVATE_VALUE_PATTERN.test(value)) {
    errors.push(`${path} contains private or signed reference text`);
    return errors;
  }

  if (Array.isArray(value)) {
    if (mode === 'public' && blockedKeys.has(parentKey) && value.length > 0) {
      errors.push(`${path} must not expose raw arrays in public reports`);
    }
    value.forEach((item, index) => scanUnsafe(item, { mode, path: `${path}[${index}]`, errors, parentKey }));
    return errors;
  }

  if (!isPlainObject(value)) return errors;

  for (const [key, nested] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    const nonEmptyBlockedArray = Array.isArray(nested) && nested.length > 0 && blockedKeys.has(key);
    const blockedObject = isPlainObject(nested) && blockedKeys.has(key);
    const blockedScalar = nested != null && !Array.isArray(nested) && !isPlainObject(nested) && blockedKeys.has(key);

    if (nonEmptyBlockedArray || blockedObject || blockedScalar) {
      errors.push(`${nestedPath} is not safe for ${mode} report display`);
    }

    scanUnsafe(nested, { mode, path: nestedPath, errors, parentKey: key });
  }

  return errors;
}

export function validateCoachReportSafety(payload = {}) {
  return result(scanUnsafe(payload, { mode: 'coach' }));
}

export function validatePublicSharedReportSafety(payload = {}) {
  return result(scanUnsafe(payload, { mode: 'public' }));
}
