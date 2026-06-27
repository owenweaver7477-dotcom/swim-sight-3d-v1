import {
  CONFIDENCE_LEVELS,
  MEASUREMENT_TYPES,
  SOURCE_LABELS,
} from './contracts.js';

const DEFAULT_SCHEMA_VERSION = 'swim_sight_biomechanics_v1';

function finiteNumberOrNull(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function boundedConfidenceScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sourceOrTemplate(source) {
  return SOURCE_LABELS.includes(source) ? source : 'template';
}

function confidenceOrNone(confidence) {
  return CONFIDENCE_LEVELS.includes(confidence) ? confidence : 'none';
}

function measurementTypeOrNotAvailable(type) {
  return MEASUREMENT_TYPES.includes(type) ? type : 'not_available';
}

export function createVideoMetadata(overrides = {}) {
  const width = finiteNumberOrNull(overrides.width);
  const height = finiteNumberOrNull(overrides.height);
  const aspectRatio = finiteNumberOrNull(overrides.aspectRatio)
    ?? (width && height ? Number((width / height).toFixed(4)) : null);
  const orientation = overrides.orientation
    || (width && height
      ? width > height ? 'landscape' : height > width ? 'portrait' : 'square'
      : 'unknown');
  return {
    videoId: overrides.videoId ?? null,
    durationSeconds: finiteNumberOrNull(overrides.durationSeconds),
    fps: finiteNumberOrNull(overrides.fps),
    frameCount: finiteNumberOrNull(overrides.frameCount),
    width,
    height,
    aspectRatio,
    codec: overrides.codec ?? null,
    containerType: overrides.containerType ?? null,
    fileSizeMb: finiteNumberOrNull(overrides.fileSizeMb),
    orientation,
    metadataComplete: overrides.metadataComplete === true,
    errors: safeArray(overrides.errors),
    source: sourceOrTemplate(overrides.source || 'template'),
    warnings: safeArray(overrides.warnings),
  };
}

export function createSampledVideoFrame(overrides = {}) {
  return {
    frameIndex: finiteNumberOrNull(overrides.frameIndex) ?? 0,
    timestampMs: finiteNumberOrNull(overrides.timestampMs) ?? 0,
    imageWidth: finiteNumberOrNull(overrides.imageWidth),
    imageHeight: finiteNumberOrNull(overrides.imageHeight),
    source: 'video_metadata',
  };
}

export function createPose2DLandmark(overrides = {}) {
  return {
    x: finiteNumberOrNull(overrides.x),
    y: finiteNumberOrNull(overrides.y),
    confidence: boundedConfidenceScore(overrides.confidence),
    visibility: finiteNumberOrNull(overrides.visibility),
    source: 'pose_2d',
  };
}

export function createPose2DFrame(overrides = {}) {
  const landmarks = overrides.landmarks && typeof overrides.landmarks === 'object'
    ? overrides.landmarks
    : {};
  return {
    frameIndex: finiteNumberOrNull(overrides.frameIndex) ?? 0,
    timestampMs: finiteNumberOrNull(overrides.timestampMs) ?? 0,
    poseDetected: overrides.poseDetected === true,
    reliable: overrides.reliable === true,
    keypointCount: finiteNumberOrNull(overrides.keypointCount) ?? Object.keys(landmarks).length,
    landmarks,
    missingJoints: safeArray(overrides.missingJoints),
    confidence: confidenceOrNone(overrides.confidence),
    source: 'pose_2d',
  };
}

export function createPose3DLandmark(overrides = {}) {
  const source = overrides.source === 'multi_view_triangulated'
    ? 'multi_view_triangulated'
    : 'monocular_estimate';
  return {
    x: finiteNumberOrNull(overrides.x),
    y: finiteNumberOrNull(overrides.y),
    z: finiteNumberOrNull(overrides.z),
    confidence: boundedConfidenceScore(overrides.confidence),
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || (source === 'monocular_estimate' ? 'estimated' : 'measured')),
    source,
  };
}

export function createPose3DFrame(overrides = {}) {
  const source = overrides.source === 'multi_view_triangulated'
    ? 'multi_view_triangulated'
    : 'monocular_estimate';
  return {
    frameIndex: finiteNumberOrNull(overrides.frameIndex) ?? 0,
    timestampMs: finiteNumberOrNull(overrides.timestampMs) ?? 0,
    joints3d: overrides.joints3d && typeof overrides.joints3d === 'object' ? overrides.joints3d : {},
    source,
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || (source === 'monocular_estimate' ? 'estimated' : 'measured')),
    confidence: confidenceOrNone(overrides.confidence),
    assumptions: safeArray(overrides.assumptions),
    cameraCount: finiteNumberOrNull(overrides.cameraCount),
    calibrationQuality: confidenceOrNone(overrides.calibrationQuality),
    syncOffsetMs: finiteNumberOrNull(overrides.syncOffsetMs),
  };
}

export function createMultiViewPose3DFrame(overrides = {}) {
  return createPose3DFrame({
    ...overrides,
    source: 'multi_view_triangulated',
    measurementType: overrides.measurementType || 'measured',
    cameraCount: finiteNumberOrNull(overrides.cameraCount) ?? 2,
  });
}

export function createMetricValue(overrides = {}) {
  return {
    value: finiteNumberOrNull(overrides.value),
    unit: overrides.unit || '',
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || 'not_available'),
    confidence: confidenceOrNone(overrides.confidence),
    source: sourceOrTemplate(overrides.source || 'biomechanics_engine'),
    timestampRangeMs: Array.isArray(overrides.timestampRangeMs) ? overrides.timestampRangeMs : null,
    assumptions: safeArray(overrides.assumptions),
  };
}

export function createBiomechanicalMetrics(overrides = {}) {
  return {
    timestampMs: finiteNumberOrNull(overrides.timestampMs),
    timestampRangeMs: Array.isArray(overrides.timestampRangeMs) ? overrides.timestampRangeMs : null,
    source: 'biomechanics_engine',
    confidence: confidenceOrNone(overrides.confidence),
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || 'estimated'),
    bodyLineAngleDegrees: overrides.bodyLineAngleDegrees || null,
    spineAngleDegrees: overrides.spineAngleDegrees || null,
    headMovement: overrides.headMovement || null,
    hipVerticalDisplacement: overrides.hipVerticalDisplacement || null,
    shoulderAngleDegrees: overrides.shoulderAngleDegrees || null,
    elbowAngleDegrees: overrides.elbowAngleDegrees || null,
    wristPath: overrides.wristPath || null,
    kneeAngleDegrees: overrides.kneeAngleDegrees || null,
    anklePath: overrides.anklePath || null,
    strokeRate: overrides.strokeRate || null,
    tempo: overrides.tempo || null,
    distancePerStrokeEstimate: overrides.distancePerStrokeEstimate || null,
    leftRightSymmetry: overrides.leftRightSymmetry || null,
    jointVelocity: overrides.jointVelocity || null,
    jointAcceleration: overrides.jointAcceleration || null,
    strokeSpecific: overrides.strokeSpecific && typeof overrides.strokeSpecific === 'object' ? overrides.strokeSpecific : {},
  };
}

export function createForceEstimate(overrides = {}) {
  return {
    value: finiteNumberOrNull(overrides.value),
    unit: overrides.unit || '',
    estimateType: overrides.estimateType || 'not_available',
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || 'not_available'),
    confidence: confidenceOrNone(overrides.confidence),
    assumptions: safeArray(overrides.assumptions),
    source: 'hydrodynamics_engine',
    timestampRangeMs: Array.isArray(overrides.timestampRangeMs) ? overrides.timestampRangeMs : null,
  };
}

export function createStrokePhaseWindow(overrides = {}) {
  return {
    phase: overrides.phase || null,
    stroke: overrides.stroke || null,
    startTimestampMs: finiteNumberOrNull(overrides.startTimestampMs),
    endTimestampMs: finiteNumberOrNull(overrides.endTimestampMs),
    confidence: confidenceOrNone(overrides.confidence),
    source: sourceOrTemplate(overrides.source || 'biomechanics_engine'),
    evidenceFrameCount: finiteNumberOrNull(overrides.evidenceFrameCount) ?? 0,
  };
}

export function createAICoachingFinding(overrides = {}) {
  return {
    findingId: overrides.findingId || null,
    title: overrides.title || '',
    severity: overrides.severity || 'info',
    confidence: confidenceOrNone(overrides.confidence),
    timestampStartSeconds: finiteNumberOrNull(overrides.timestampStartSeconds),
    timestampEndSeconds: finiteNumberOrNull(overrides.timestampEndSeconds),
    phase: overrides.phase || null,
    evidenceMetrics: overrides.evidenceMetrics && typeof overrides.evidenceMetrics === 'object' ? overrides.evidenceMetrics : {},
    forceExplanation: overrides.forceExplanation || null,
    technicalExplanation: overrides.technicalExplanation || null,
    correctionCue: overrides.correctionCue || null,
    drill: overrides.drill || null,
    coachReviewRequired: overrides.coachReviewRequired !== false,
    source: sourceOrTemplate(overrides.source || 'biomechanics_engine'),
  };
}

export function createCoachApprovalState(overrides = {}) {
  return {
    decision: overrides.decision || 'pending',
    approvedByUserId: overrides.approvedByUserId || null,
    approvedAt: overrides.approvedAt || null,
    coachReviewed: overrides.coachReviewed === true,
    publicReportAllowed: overrides.publicReportAllowed === true,
    source: 'coach_review',
    notes: overrides.notes || null,
  };
}

export function createProcessingArtifactReference(overrides = {}) {
  return {
    artifactId: overrides.artifactId || null,
    kind: overrides.kind || 'metadata_json',
    storageBucket: overrides.storageBucket || null,
    storagePath: overrides.storagePath || null,
    signedUrl: null,
    publicSafe: overrides.publicSafe === true,
    coachReportSafe: overrides.coachReportSafe === true,
    createdAt: overrides.createdAt || null,
  };
}

export function createPoseSummary(overrides = {}) {
  return {
    pose2dFrameCount: finiteNumberOrNull(overrides.pose2dFrameCount) ?? 0,
    pose3dFrameCount: finiteNumberOrNull(overrides.pose3dFrameCount) ?? 0,
    averageKeypoints: finiteNumberOrNull(overrides.averageKeypoints),
    poseDetectionRate: finiteNumberOrNull(overrides.poseDetectionRate),
    pose3dSource: overrides.pose3dSource || null,
    confidence: confidenceOrNone(overrides.confidence),
    qualityFlags: safeArray(overrides.qualityFlags),
  };
}

export function createBiomechanicsSummary(overrides = {}) {
  return {
    metricsAvailable: overrides.metricsAvailable === true,
    metricCount: finiteNumberOrNull(overrides.metricCount) ?? 0,
    confidence: confidenceOrNone(overrides.confidence),
    source: 'biomechanics_engine',
    summaryMetrics: overrides.summaryMetrics && typeof overrides.summaryMetrics === 'object' ? overrides.summaryMetrics : {},
    limitations: safeArray(overrides.limitations),
  };
}

export function createForceSummary(overrides = {}) {
  return {
    forceEstimatesAvailable: overrides.forceEstimatesAvailable === true,
    measurementType: measurementTypeOrNotAvailable(overrides.measurementType || 'not_available'),
    dragForceEstimate: overrides.dragForceEstimate || createForceEstimate({ estimateType: 'hydrodynamic', measurementType: 'not_available' }),
    propulsionTimingEstimate: overrides.propulsionTimingEstimate || createForceEstimate({ estimateType: 'propulsion', unit: 'score', measurementType: 'not_available' }),
    forceLeakageIndicators: safeArray(overrides.forceLeakageIndicators),
    confidence: confidenceOrNone(overrides.confidence),
    assumptions: safeArray(overrides.assumptions),
    source: 'hydrodynamics_engine',
  };
}

export function createAnalysisPayloadSummary(overrides = {}) {
  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    analysisId: overrides.analysisId || null,
    videoId: overrides.videoId || null,
    swimmerId: overrides.swimmerId || null,
    stroke: overrides.stroke || 'unknown',
    viewType: overrides.viewType || 'unknown',
    availabilityState: overrides.availabilityState || 'not_started',
    videoMetadata: overrides.videoMetadata || createVideoMetadata(),
    sampledFrames: safeArray(overrides.sampledFrames),
    poseSummary: overrides.poseSummary || createPoseSummary(),
    biomechanicsSummary: overrides.biomechanicsSummary || createBiomechanicsSummary(),
    forceSummary: overrides.forceSummary || createForceSummary(),
    phaseWindows: safeArray(overrides.phaseWindows),
    aiFindings: safeArray(overrides.aiFindings),
    coachApproval: overrides.coachApproval || createCoachApprovalState(),
    artifacts: safeArray(overrides.artifacts),
    createdAt: overrides.createdAt || null,
    updatedAt: overrides.updatedAt || null,
  };
}
