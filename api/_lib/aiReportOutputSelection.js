import {
  buildAthleteProfileReadiness,
  buildReportOutputPlan,
} from '../../src/lib/aiReportOutputs.js';

function envEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function numberInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function safeText(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

export function reportOutputFeatureFlags(env = process.env) {
  return {
    timing_metrics_enabled: envEnabled(env.ENABLE_TIMING_METRICS),
    distance_metrics_enabled: envEnabled(env.ENABLE_DISTANCE_METRICS),
    advanced_metrics_enabled: envEnabled(env.ENABLE_ADVANCED_AI_METRICS),
    estimated_drag_enabled: envEnabled(env.ENABLE_ESTIMATED_DRAG),
    skills_analysis_enabled: envEnabled(env.ENABLE_SKILLS_AI_ANALYSIS),
  };
}

export function sanitizeAthleteProfileInputs(value = {}) {
  return {
    body_mass_kg: numberInRange(value.body_mass_kg, 20, 250),
    approximate_height_cm: numberInRange(value.approximate_height_cm, 100, 250),
    age_group: safeText(value.age_group, 40),
    pool_length_m: numberInRange(value.pool_length_m, 10, 100),
    calibration_available: value.calibration_available === true,
    wingspan_cm: numberInRange(value.wingspan_cm, 100, 280),
    skill_level: safeText(value.skill_level, 40),
    race_context: safeText(value.race_context, 240),
  };
}

export function validateAIReportOutputRequest({ requestBody = {}, upload = {}, env = process.env } = {}) {
  const selectedOutputIds = Array.isArray(requestBody.selected_report_outputs)
    ? requestBody.selected_report_outputs.filter((id) => typeof id === 'string')
    : [];
  if (!selectedOutputIds.length) {
    return { valid: false, status: 400, error: 'Choose at least one AI report output before starting analysis.' };
  }
  if (requestBody.coach_confirmed_draft_ai !== true) {
    return { valid: false, status: 400, error: 'Confirm that AI output is a draft requiring coach review before starting analysis.' };
  }

  const athleteProfileInputs = sanitizeAthleteProfileInputs(requestBody.athlete_profile_inputs || {});
  const features = reportOutputFeatureFlags(env);
  const readiness = buildAthleteProfileReadiness({
    athleteProfile: athleteProfileInputs,
    stroke: upload.stroke_type,
    cameraAngle: upload.camera_angle,
    videoDurationSeconds: upload.duration_seconds,
    features,
  });
  const plan = buildReportOutputPlan({ selectedOutputIds, readiness });
  if (!plan.valid) {
    return {
      valid: false,
      status: 422,
      error: 'One or more selected AI report outputs are unavailable for this clip.',
      locked_outputs: plan.locked,
    };
  }

  return {
    valid: true,
    analysis_mode: safeText(requestBody.analysis_mode, 80) || 'custom_report',
    selected_report_outputs: plan.selected,
    athlete_profile_readiness: {
      body_mass_available: readiness.body_mass,
      height_available: readiness.height,
      pool_scale_available: readiness.calibration,
      calibration_available: readiness.calibration,
      side_view_available: readiness.side_view,
      video_timing_available: readiness.video_timing,
    },
    athlete_profile_inputs: athleteProfileInputs,
    locked_outputs: [],
    estimate_only_outputs: plan.estimateOnly,
    estimated_credit_cost: plan.estimatedCredits,
    coach_confirmed_draft_ai: true,
  };
}

export function publicOutputSelection(selection = {}) {
  return {
    analysis_mode: selection.analysis_mode || null,
    selected_report_outputs: selection.selected_report_outputs || [],
    locked_outputs: selection.locked_outputs || [],
    estimate_only_outputs: selection.estimate_only_outputs || [],
    estimated_credit_cost: selection.estimated_credit_cost || 0,
    coach_confirmed_draft_ai: selection.coach_confirmed_draft_ai === true,
  };
}
