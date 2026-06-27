import {
  AVAILABILITY_STATES,
  POSE_3D_SOURCES,
} from './contracts.js';
import {
  validateCoachReportSafety,
  validatePublicSharedReportSafety,
} from './validators.js';

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function is2DPoseAvailable(payload = {}) {
  const summaryCount = asNumber(payload.poseSummary?.pose2dFrameCount);
  if (summaryCount && summaryCount > 0) return true;
  if (asArray(payload.pose2dFrames).length > 0) return true;
  return payload.availabilityState === 'pose_2d_ready';
}

export function is3DPoseAvailable(payload = {}) {
  const summaryCount = asNumber(payload.poseSummary?.pose3dFrameCount);
  const source = payload.poseSummary?.pose3dSource || payload.pose3dSource || payload.source;
  if (summaryCount && summaryCount > 0 && POSE_3D_SOURCES.includes(source)) return true;
  if (asArray(payload.pose3dFrames).length > 0) return true;
  return ['pose_3d_estimated', 'pose_3d_triangulated'].includes(payload.availabilityState);
}

export function isMonocular3DEstimateAvailable(payload = {}) {
  return is3DPoseAvailable(payload)
    && (payload.poseSummary?.pose3dSource === 'monocular_estimate'
      || payload.availabilityState === 'pose_3d_estimated');
}

export function isMultiViewTriangulatedPoseAvailable(payload = {}) {
  return is3DPoseAvailable(payload)
    && (payload.poseSummary?.pose3dSource === 'multi_view_triangulated'
      || payload.availabilityState === 'pose_3d_triangulated');
}

export function areBiomechanicsAvailable(payload = {}) {
  return payload.biomechanicsSummary?.metricsAvailable === true
    || asNumber(payload.biomechanicsSummary?.metricCount) > 0
    || payload.availabilityState === 'biomechanics_ready';
}

export function areForceEstimatesAvailable(payload = {}) {
  const force = payload.forceSummary || {};
  const dragValue = asNumber(force.dragForceEstimate?.value);
  const propulsionValue = asNumber(force.propulsionTimingEstimate?.value);
  return force.forceEstimatesAvailable === true
    || dragValue != null
    || propulsionValue != null
    || payload.availabilityState === 'force_estimates_ready';
}

export function areAIFindingsAvailable(payload = {}) {
  return asArray(payload.aiFindings).length > 0 || payload.availabilityState === 'ai_findings_ready';
}

export function requiresCoachReview(payload = {}) {
  if (payload.availabilityState === 'coach_review_required') return true;
  return asArray(payload.aiFindings).some((finding) => finding.coachReviewRequired === true);
}

export function isApprovedForReport(payload = {}) {
  return payload.availabilityState === 'approved'
    || (payload.coachApproval?.coachReviewed === true && payload.coachApproval?.publicReportAllowed === true);
}

export function getAnalysisAvailabilityState(payload = {}) {
  if (payload.availabilityState && AVAILABILITY_STATES.includes(payload.availabilityState)) {
    return payload.availabilityState;
  }
  if (isApprovedForReport(payload)) return 'approved';
  if (requiresCoachReview(payload)) return 'coach_review_required';
  if (areAIFindingsAvailable(payload)) return 'ai_findings_ready';
  if (areForceEstimatesAvailable(payload)) return 'force_estimates_ready';
  if (areBiomechanicsAvailable(payload)) return 'biomechanics_ready';
  if (isMultiViewTriangulatedPoseAvailable(payload)) return 'pose_3d_triangulated';
  if (isMonocular3DEstimateAvailable(payload)) return 'pose_3d_estimated';
  if (is2DPoseAvailable(payload)) return 'pose_2d_ready';
  if (asArray(payload.sampledFrames).length > 0) return 'frames_sampled';
  if (payload.videoMetadata?.durationSeconds || payload.videoMetadata?.fps || payload.videoMetadata?.frameCount) {
    return 'metadata_ready';
  }
  return 'not_started';
}

export function getCoachReportSafety(payload = {}) {
  return validateCoachReportSafety(payload);
}

export function getPublicSharedReportSafety(payload = {}) {
  return validatePublicSharedReportSafety(payload);
}

export function isSafeToShowInCoachReports(payload = {}) {
  return getCoachReportSafety(payload).ok;
}

export function isSafeToShowInPublicSharedReports(payload = {}) {
  return getPublicSharedReportSafety(payload).ok;
}
