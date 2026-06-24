export const OUTPUT_AVAILABILITY = Object.freeze({
  AVAILABLE: 'available',
  ESTIMATE_ONLY: 'estimate_only',
  REQUIRES_ATHLETE_PROFILE: 'requires_athlete_profile',
  REQUIRES_CALIBRATION: 'requires_calibration',
  REQUIRES_CAMERA_ANGLE: 'requires_camera_angle',
  REQUIRES_LONGER_VIDEO: 'requires_longer_video',
  PREVIEW_ONLY: 'preview_only',
  NOT_AVAILABLE: 'not_available_yet',
});

export const OUTPUT_AVAILABILITY_LABELS = Object.freeze({
  [OUTPUT_AVAILABILITY.AVAILABLE]: 'Available',
  [OUTPUT_AVAILABILITY.ESTIMATE_ONLY]: 'Estimate-only',
  [OUTPUT_AVAILABILITY.REQUIRES_ATHLETE_PROFILE]: 'Requires athlete profile',
  [OUTPUT_AVAILABILITY.REQUIRES_CALIBRATION]: 'Requires calibration',
  [OUTPUT_AVAILABILITY.REQUIRES_CAMERA_ANGLE]: 'Requires specific camera angle',
  [OUTPUT_AVAILABILITY.REQUIRES_LONGER_VIDEO]: 'Requires longer video',
  [OUTPUT_AVAILABILITY.PREVIEW_ONLY]: 'Preview-only',
  [OUTPUT_AVAILABILITY.NOT_AVAILABLE]: 'Not available yet',
});

export const AI_REPORT_OUTPUT_CATEGORIES = [
  { id: 'core', label: 'Core technical outputs' },
  { id: 'timing', label: 'Timing and rhythm metrics' },
  { id: 'distance', label: 'Distance and efficiency estimates' },
  { id: 'advanced', label: 'Advanced estimate-only metrics' },
  { id: 'skills', label: 'Starts, turns and underwater' },
];

export const AI_REPORT_OUTPUTS = [
  { id: 'general_fault_scan', category: 'core', label: 'General fault scan', description: 'Checks the visible stroke for sustained technical signals.', creditWeight: 1, coachReviewOnly: true },
  { id: 'stroke_phase_breakdown', category: 'core', label: 'Stroke phase breakdown', description: 'Organises supported findings by stroke phase.', creditWeight: 2, coachReviewOnly: true },
  { id: 'body_line_analysis', category: 'core', label: 'Body line analysis', description: 'Reviews visible head, hip and line relationships.', creditWeight: 1, coachReviewOnly: true },
  { id: 'head_position_analysis', category: 'core', label: 'Head position analysis', description: 'Checks visible head-line changes through the stroke.', creditWeight: 1, coachReviewOnly: true },
  { id: 'breathing_timing', category: 'core', label: 'Breathing timing', description: 'Reviews breath timing where the angle clearly supports it.', creditWeight: 1, coachReviewOnly: true },
  { id: 'kick_timing', category: 'core', label: 'Kick timing', description: 'Checks visible kick setup and timing signals.', creditWeight: 1, coachReviewOnly: true },
  { id: 'kick_width', category: 'core', label: 'Kick width', description: 'Reviews visible knee and ankle width relationships.', creditWeight: 1, coachReviewOnly: true, requirements: ['side_or_front_view'] },
  { id: 'pull_catch_timing', category: 'core', label: 'Pull / catch timing', description: 'Reviews visible catch and pull timing cues.', creditWeight: 1, coachReviewOnly: true },
  { id: 'recovery_timing', category: 'core', label: 'Recovery timing', description: 'Checks visible arm or leg recovery timing.', creditWeight: 1, coachReviewOnly: true },
  { id: 'stroke_rhythm', category: 'core', label: 'Stroke rhythm', description: 'Reviews repeated timing signals across sampled frames.', creditWeight: 1, coachReviewOnly: true },
  { id: 'coach_cue_suggestions', category: 'core', label: 'Coach cue suggestions', description: 'Creates draft correction cues for coach approval.', creditWeight: 1, coachReviewOnly: true },
  { id: 'drill_recommendations', category: 'core', label: 'Drill recommendations', description: 'Links draft findings to relevant drills for coach selection.', creditWeight: 1, coachReviewOnly: true },

  { id: 'stroke_rate', category: 'timing', label: 'Stroke rate', description: 'Future cycle-rate estimate from reliable repeated stroke timing.', creditWeight: 1, requirements: ['video_timing'], feature: 'timing_metrics_enabled' },
  { id: 'stroke_count', category: 'timing', label: 'Stroke count', description: 'Future count of complete visible cycles.', creditWeight: 1, requirements: ['video_timing'], feature: 'timing_metrics_enabled' },
  { id: 'stroke_cycle_timing', category: 'timing', label: 'Stroke cycle timing', description: 'Future timing estimate across complete visible cycles.', creditWeight: 2, requirements: ['video_timing'], feature: 'timing_metrics_enabled', estimateOnly: true },
  { id: 'phase_duration', category: 'timing', label: 'Phase duration', description: 'Future phase-duration estimate from validated phase tracking.', creditWeight: 2, requirements: ['video_timing'], feature: 'timing_metrics_enabled', estimateOnly: true },
  { id: 'tempo_consistency', category: 'timing', label: 'Tempo consistency', description: 'Future estimate of cycle-to-cycle timing variation.', creditWeight: 1, requirements: ['video_timing'], feature: 'timing_metrics_enabled', estimateOnly: true },
  { id: 'breakout_timing', category: 'timing', label: 'Breakout timing', description: 'Future timing estimate for clearly tagged breakout footage.', creditWeight: 2, requirements: ['video_timing', 'start_turn_footage'], feature: 'skills_analysis_enabled', estimateOnly: true },
  { id: 'start_turn_timing', category: 'timing', label: 'Start / turn timing', description: 'Future timing estimate for tagged start or turn footage.', creditWeight: 2, requirements: ['video_timing', 'start_turn_footage'], feature: 'skills_analysis_enabled', estimateOnly: true },

  { id: 'distance_per_stroke', category: 'distance', label: 'Estimated distance per stroke', description: 'Future distance estimate using a known pool reference.', creditWeight: 2, requirements: ['calibration'], feature: 'distance_metrics_enabled', estimateOnly: true },
  { id: 'estimated_velocity', category: 'distance', label: 'Estimated velocity', description: 'Future movement-speed estimate using calibrated scale.', creditWeight: 2, requirements: ['calibration'], feature: 'distance_metrics_enabled', estimateOnly: true },
  { id: 'split_movement_timing', category: 'distance', label: 'Split-style movement timing', description: 'Future calibrated movement timing across the clip.', creditWeight: 2, requirements: ['calibration'], feature: 'distance_metrics_enabled', estimateOnly: true },
  { id: 'distance_per_cycle', category: 'distance', label: 'Distance covered per cycle', description: 'Future calibrated cycle-distance estimate.', creditWeight: 2, requirements: ['calibration'], feature: 'distance_metrics_enabled', estimateOnly: true },
  { id: 'stroke_efficiency_indicators', category: 'distance', label: 'Stroke efficiency indicators', description: 'Future coach-reviewed indicators combining timing and calibrated distance.', creditWeight: 2, requirements: ['calibration', 'video_timing'], feature: 'distance_metrics_enabled', estimateOnly: true },

  { id: 'estimated_drag_force', category: 'advanced', label: 'Estimated drag force', description: 'Internal pilot estimate requiring athlete inputs, calibration and reliable side-view pose.', creditWeight: 4, requirements: ['body_mass', 'height', 'calibration', 'side_view'], feature: 'estimated_drag_enabled', estimateOnly: true },
  { id: 'estimated_propulsive_drag', category: 'advanced', label: 'Estimated propulsive drag', description: 'Future internal estimate of propulsion and resistance balance.', creditWeight: 4, requirements: ['body_mass', 'height', 'calibration', 'side_view'], feature: 'advanced_metrics_enabled', estimateOnly: true },
  { id: 'estimated_frontal_drag_trend', category: 'advanced', label: 'Estimated frontal drag trend', description: 'Future trend estimate, not a measured drag value.', creditWeight: 3, requirements: ['body_mass', 'height', 'calibration', 'side_view'], feature: 'advanced_metrics_enabled', estimateOnly: true },
  { id: 'body_line_drag_risk', category: 'advanced', label: 'Body-line drag risk', description: 'Qualitative resistance-risk cue from visible body line.', creditWeight: 1, requirements: ['side_view'], estimateOnly: true, coachReviewOnly: true },
  { id: 'velocity_loss_cycle', category: 'advanced', label: 'Velocity loss through stroke cycle', description: 'Future calibrated intra-cycle velocity estimate.', creditWeight: 3, requirements: ['calibration', 'video_timing'], feature: 'advanced_metrics_enabled', estimateOnly: true },
  { id: 'intra_cycle_acceleration', category: 'advanced', label: 'Intra-cycle acceleration / deceleration', description: 'Future calibrated acceleration estimate.', creditWeight: 3, requirements: ['calibration', 'video_timing'], feature: 'advanced_metrics_enabled', estimateOnly: true },
  { id: 'kick_propulsion_timing', category: 'advanced', label: 'Kick propulsion timing estimate', description: 'Future coach-reviewed timing estimate.', creditWeight: 2, requirements: ['video_timing'], feature: 'advanced_metrics_enabled', estimateOnly: true },
  { id: 'pull_propulsion_timing', category: 'advanced', label: 'Pull propulsion timing estimate', description: 'Future coach-reviewed timing estimate.', creditWeight: 2, requirements: ['video_timing'], feature: 'advanced_metrics_enabled', estimateOnly: true },

  { id: 'start_setup_review', category: 'skills', label: 'Start setup review', description: 'Future AI-assisted review of tagged start footage; manual focus is available now.', creditWeight: 2, requirements: ['start_footage'], feature: 'skills_analysis_enabled' },
  { id: 'dive_breakout_sequence', category: 'skills', label: 'Dive / breakout sequence review', description: 'Future linked review of entry, streamline and breakout.', creditWeight: 2, requirements: ['start_footage'], feature: 'skills_analysis_enabled' },
  { id: 'turn_approach', category: 'skills', label: 'Turn approach', description: 'Future AI-assisted review of tagged turn footage.', creditWeight: 2, requirements: ['turn_footage'], feature: 'skills_analysis_enabled' },
  { id: 'wall_contact_rotation', category: 'skills', label: 'Wall contact / rotation', description: 'Future review of visible wall contact and rotation.', creditWeight: 2, requirements: ['turn_footage'], feature: 'skills_analysis_enabled' },
  { id: 'push_off_line', category: 'skills', label: 'Push-off line', description: 'Future review of visible push-off body line.', creditWeight: 2, requirements: ['turn_footage'], feature: 'skills_analysis_enabled' },
  { id: 'underwater_phase', category: 'skills', label: 'Underwater phase', description: 'Future review of clearly tagged underwater footage.', creditWeight: 2, requirements: ['underwater_footage'], feature: 'skills_analysis_enabled' },
  { id: 'first_stroke_timing', category: 'skills', label: 'First stroke timing', description: 'Future transition timing estimate after breakout.', creditWeight: 2, requirements: ['underwater_footage', 'video_timing'], feature: 'skills_analysis_enabled', estimateOnly: true },
];

export const AI_REPORT_PRESETS = [
  { id: 'basic_technical_scan', label: 'Basic technical scan', outputIds: ['general_fault_scan', 'body_line_analysis', 'head_position_analysis', 'stroke_rhythm', 'coach_cue_suggestions', 'drill_recommendations'] },
  { id: 'breaststroke_technical_report', label: 'Breaststroke technical report', outputIds: ['kick_timing', 'kick_width', 'body_line_analysis', 'pull_catch_timing', 'recovery_timing', 'stroke_rhythm', 'stroke_phase_breakdown', 'drill_recommendations'] },
  { id: 'freestyle_technical_report', label: 'Freestyle technical report', outputIds: ['body_line_analysis', 'head_position_analysis', 'breathing_timing', 'pull_catch_timing', 'recovery_timing', 'stroke_rhythm', 'stroke_phase_breakdown', 'drill_recommendations'] },
  { id: 'starts_turns_report', label: 'Starts and turns report', outputIds: ['start_setup_review', 'dive_breakout_sequence', 'turn_approach', 'wall_contact_rotation', 'push_off_line', 'breakout_timing', 'first_stroke_timing'] },
  { id: 'underwater_report', label: 'Underwater report', outputIds: ['underwater_phase', 'breakout_timing', 'first_stroke_timing', 'body_line_analysis'] },
  { id: 'advanced_metrics_report', label: 'Advanced metrics report', outputIds: ['stroke_rate', 'stroke_cycle_timing', 'distance_per_stroke', 'estimated_velocity', 'estimated_drag_force', 'body_line_drag_risk'] },
  { id: 'manual_review_only', label: 'Manual coach review only', outputIds: [], manualOnly: true },
];

const OUTPUT_INDEX = new Map(AI_REPORT_OUTPUTS.map((output) => [output.id, output]));

function isFiniteInRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

export function buildAthleteProfileReadiness({ athleteProfile = {}, stroke = '', cameraAngle = '', videoDurationSeconds = null, features = {} } = {}) {
  const normalizedStroke = String(stroke).toLowerCase();
  const normalizedAngle = String(cameraAngle).toLowerCase();
  const poolLength = Number(athleteProfile.pool_length_m);
  const knownScale = athleteProfile.calibration_available === true && Number.isFinite(poolLength) && poolLength > 0;
  return {
    body_mass: isFiniteInRange(athleteProfile.body_mass_kg, 20, 250),
    height: isFiniteInRange(athleteProfile.approximate_height_cm, 100, 250),
    calibration: knownScale,
    side_view: normalizedAngle.includes('side'),
    side_or_front_view: normalizedAngle.includes('side') || normalizedAngle.includes('front'),
    video_timing: Number(videoDurationSeconds) >= 5,
    start_footage: normalizedStroke === 'start',
    turn_footage: normalizedStroke === 'turn',
    start_turn_footage: ['start', 'turn', 'underwater', 'breakout'].includes(normalizedStroke),
    underwater_footage: ['underwater', 'breakout', 'start', 'turn'].includes(normalizedStroke) || normalizedAngle.includes('underwater'),
    timing_metrics_enabled: features.timing_metrics_enabled === true,
    distance_metrics_enabled: features.distance_metrics_enabled === true,
    advanced_metrics_enabled: features.advanced_metrics_enabled === true,
    estimated_drag_enabled: features.estimated_drag_enabled === true,
    skills_analysis_enabled: features.skills_analysis_enabled === true,
  };
}

function stateForMissingRequirement(requirement) {
  if (['body_mass', 'height'].includes(requirement)) return OUTPUT_AVAILABILITY.REQUIRES_ATHLETE_PROFILE;
  if (requirement === 'calibration') return OUTPUT_AVAILABILITY.REQUIRES_CALIBRATION;
  if (['side_view', 'side_or_front_view', 'start_footage', 'turn_footage', 'start_turn_footage', 'underwater_footage'].includes(requirement)) return OUTPUT_AVAILABILITY.REQUIRES_CAMERA_ANGLE;
  if (requirement === 'video_timing') return OUTPUT_AVAILABILITY.REQUIRES_LONGER_VIDEO;
  return OUTPUT_AVAILABILITY.NOT_AVAILABLE;
}

export function getReportOutputState(outputOrId, readiness = {}) {
  const output = typeof outputOrId === 'string' ? OUTPUT_INDEX.get(outputOrId) : outputOrId;
  if (!output) return { state: OUTPUT_AVAILABILITY.NOT_AVAILABLE, selectable: false, missing: ['unknown_output'] };
  const missing = (output.requirements || []).filter((requirement) => readiness[requirement] !== true);
  if (missing.length) return { state: stateForMissingRequirement(missing[0]), selectable: false, missing };
  if (output.feature && readiness[output.feature] !== true) {
    return { state: OUTPUT_AVAILABILITY.PREVIEW_ONLY, selectable: false, missing: [output.feature] };
  }
  return {
    state: output.estimateOnly ? OUTPUT_AVAILABILITY.ESTIMATE_ONLY : OUTPUT_AVAILABILITY.AVAILABLE,
    selectable: true,
    missing: [],
  };
}

export function estimateAIReportCredits(selectedOutputIds = []) {
  return Array.from(new Set(selectedOutputIds)).reduce((total, id) => total + (OUTPUT_INDEX.get(id)?.creditWeight || 0), 0);
}

export function estimateAIProcessingMinutes(selectedOutputIds = []) {
  const credits = estimateAIReportCredits(selectedOutputIds);
  if (credits <= 4) return 'About 2-4 minutes';
  if (credits <= 9) return 'About 4-7 minutes';
  return 'About 6-10 minutes';
}

export function buildReportOutputPlan({ selectedOutputIds = [], readiness = {} } = {}) {
  const requested = Array.from(new Set(selectedOutputIds));
  const selected = [];
  const locked = [];
  const estimateOnly = [];
  for (const id of requested) {
    const output = OUTPUT_INDEX.get(id);
    const availability = getReportOutputState(output || id, readiness);
    if (!output || !availability.selectable) {
      locked.push({ id, state: availability.state, missing: availability.missing });
      continue;
    }
    selected.push(id);
    if (output.estimateOnly) estimateOnly.push(id);
  }
  return {
    requested,
    selected,
    locked,
    estimateOnly,
    estimatedCredits: estimateAIReportCredits(selected),
    valid: requested.length > 0 && selected.length === requested.length,
  };
}

export function getReportOutput(id) {
  return OUTPUT_INDEX.get(id) || null;
}
