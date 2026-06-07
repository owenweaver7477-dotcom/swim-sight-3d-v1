// localStorage state management for Swim Sight 3D
const KEYS = {
  activeClub: 'swimSight3d.activeClub',
  activeRole: 'swimSight3d.activeRole',
  reviewSession: 'swimSight3d.reviewSession',
  coachModeFinding: 'swimSight3d.coachModeFinding',
};

function safeGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

function safeSet(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* silently fail */ }
}

export function getActiveClub() { return safeGet(KEYS.activeClub); }
export function setActiveClub(club) { safeSet(KEYS.activeClub, club); }

export function getActiveRole() { return safeGet(KEYS.activeRole) || 'personal'; }
export function setActiveRole(role) { safeSet(KEYS.activeRole, role); }

export function getReviewSession() { return safeGet(KEYS.reviewSession); }
export function setReviewSession(session) { safeSet(KEYS.reviewSession, session); }

export function getCoachModeFinding() { return safeGet(KEYS.coachModeFinding); }
export function setCoachModeFinding(finding) { safeSet(KEYS.coachModeFinding, finding); }

export function signOut() {
  safeSet(KEYS.activeRole, null);
  safeSet(KEYS.activeClub, null);
  safeSet(KEYS.coachModeFinding, null);
}

export const SWIM_STROKES = [
  'Freestyle', 'Breaststroke', 'Butterfly', 'Backstroke',
  'Starts', 'Turns', 'Underwater', 'Individual Medley / Mixed Stroke'
];

export const DRYLAND_MOVEMENTS = [
  'Breaststroke Kick Mimic', 'Squat', 'Single-Leg Squat', 'Lunge',
  'Hip Mobility', 'Ankle Mobility', 'Shoulder Mobility',
  'Streamline Position', 'Start Jump Mechanics', 'Gym Lift Review'
];

export const CAMERA_ANGLES = [
  'Side', 'Front', 'Rear',
  'Underwater Side', 'Underwater Front', 'Underwater Rear',
  'Above Water', 'Block Start Angle', 'Turn Wall Angle', 'Unknown'
];

export const SWIM_STROKES_FULL = [
  'Freestyle', 'Breaststroke', 'Butterfly', 'Backstroke',
  'Individual Medley', 'Start', 'Turn', 'Underwater', 'Breakout', 'Pullout',
];

export const SESSION_TYPES = [
  'Training', 'Race', 'Test Set', 'Private Analysis', 'Technical Review', 'Competition Review'
];

export const REVIEW_TYPES = [
  { value: 'full_review', label: 'Full Review' },
  { value: 'quick_coach_review', label: 'Quick Coach Review' },
  { value: 'dryland_movement_review', label: 'Dryland Movement Review' },
];

export const FAULT_SUGGESTIONS = {
  'Knees Too Wide': { cue: 'Keep knees inside hip line during heel recovery', drill: 'Narrow Knee Wall Kick', severity: 'high', next_focus: 'Narrow knee recovery before foot turn' },
  'Early Foot Turn': { cue: 'Heels up first — delay foot turn until heels are at bum height', drill: 'Late Turn Kick Drill', severity: 'high', next_focus: 'Heel-first recovery sequence' },
  'Hips Dropping': { cue: 'Press chest down slightly — drive hips up on finish', drill: 'Torpedo Kick Drill', severity: 'medium', next_focus: 'Body line through kick cycle' },
  'Circular Kick': { cue: 'Drive feet straight back — pistons, not circles', drill: 'Piston Snap Drill', severity: 'high', next_focus: 'Backward propulsion direction' },
  'Slow Heel Recovery': { cue: 'Fast heels up while knees stay narrow', drill: 'Band Kick', severity: 'medium', next_focus: 'Recovery speed and timing' },
  'Weak Catch': { cue: 'Press early — feel the water before the pull', drill: 'Catch-Up Drill', severity: 'medium', next_focus: 'Early vertical forearm position' },
  'Head Lifting Too High': { cue: 'Chin near surface — one goggle in, one out', drill: 'Low Breath Drill', severity: 'medium', next_focus: 'Head position during breath' },
  'Timing Rushed': { cue: 'Glide into the outsweep — do not rush the pull', drill: '3-count Glide Drill', severity: 'medium', next_focus: 'Stroke cycle timing' },
  'Glide Too Long': { cue: 'Start the pull while still moving forward', drill: 'Tempo Trainer Drill', severity: 'low', next_focus: 'Optimal glide duration' },
  'Hands Too Deep': { cue: 'Keep hands level — pull from width, not depth', drill: 'Shallow Pull Drill', severity: 'medium', next_focus: 'Pull plane and depth' },
  'Dropped Elbow': { cue: 'Lead with the elbow — fingertips point down early', drill: 'Fingertip Drag', severity: 'high', next_focus: 'High elbow catch setup' },
  'Crossing Midline': { cue: 'Entry at shoulder-width — no crossover', drill: 'Catch-Up Drill', severity: 'medium', next_focus: 'Hand entry line' },
  'Late Breath': { cue: 'Begin rotation as pulling arm passes hip', drill: 'Side Kick Rotation', severity: 'low', next_focus: 'Breath timing in stroke cycle' },
  'Flat Body': { cue: 'Drive hips from side to side — hip leads shoulder', drill: '6-3-6 Drill', severity: 'medium', next_focus: 'Hip and shoulder rotation' },
  'Head Moving': { cue: 'Still head — eyes fixed on ceiling tile', drill: 'Cup Drill', severity: 'medium', next_focus: 'Head stability in backstroke' },
  'Poor Rotation': { cue: 'Shoulder drives fully through each stroke', drill: 'Single Arm Backstroke', severity: 'high', next_focus: 'Full shoulder rotation' },
  'Late Second Kick': { cue: 'Second kick hits as hands enter — drive the recovery', drill: 'Single Arm Butterfly', severity: 'high', next_focus: 'Two-kick timing per stroke cycle' },
  'Hips Dropping Fly': { cue: 'Press chest — hips rise as chest goes down', drill: 'Body Dolphin Drill', severity: 'high', next_focus: 'Body wave initiation' },
  'Poor Streamline': { cue: 'Lock arms — zero gap hands to wall', drill: 'Wall Streamline Test', severity: 'medium', next_focus: 'Overhead position and lock' },
  'Early Breakout': { cue: 'One more kick — do not surface until speed is gained', drill: 'Underwater Dolphin Count', severity: 'medium', next_focus: 'Breakout timing off each wall' },
};

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-400' },
];

export const REFERENCE_PROFILES_LIST = [
  { name: 'Elite 50 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '50 m' },
  { name: 'Elite 100 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '100 m' },
  { name: 'Elite 200 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '200 m' },
  { name: 'Elite 400 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '400 m' },
  { name: 'Elite 800 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '800 m' },
  { name: 'Elite 1500 m Freestyle Reference', stroke_group: 'Freestyle', event_distance: '1500 m' },
  { name: 'Elite 50 m Breaststroke Reference', stroke_group: 'Breaststroke', event_distance: '50 m' },
  { name: 'Elite 100 m Breaststroke Reference', stroke_group: 'Breaststroke', event_distance: '100 m' },
  { name: 'Elite 200 m Breaststroke Reference', stroke_group: 'Breaststroke', event_distance: '200 m' },
  { name: 'Breaststroke Pullout Reference', stroke_group: 'Breaststroke', event_distance: 'N/A' },
  { name: 'Elite 50 m Butterfly Reference', stroke_group: 'Butterfly', event_distance: '50 m' },
  { name: 'Elite 100 m Butterfly Reference', stroke_group: 'Butterfly', event_distance: '100 m' },
  { name: 'Elite 200 m Butterfly Reference', stroke_group: 'Butterfly', event_distance: '200 m' },
  { name: 'Elite 50 m Backstroke Reference', stroke_group: 'Backstroke', event_distance: '50 m' },
  { name: 'Elite 100 m Backstroke Reference', stroke_group: 'Backstroke', event_distance: '100 m' },
  { name: 'Elite 200 m Backstroke Reference', stroke_group: 'Backstroke', event_distance: '200 m' },
  { name: 'Elite 200 m Individual Medley Reference', stroke_group: 'Individual Medley', event_distance: '200 m' },
  { name: 'Elite 400 m Individual Medley Reference', stroke_group: 'Individual Medley', event_distance: '400 m' },
  { name: 'Butterfly-to-Backstroke Transition Reference', stroke_group: 'Transition', event_distance: 'N/A' },
  { name: 'Backstroke-to-Breaststroke Transition Reference', stroke_group: 'Transition', event_distance: 'N/A' },
  { name: 'Breaststroke-to-Freestyle Transition Reference', stroke_group: 'Transition', event_distance: 'N/A' },
  { name: 'Elite Start Reference', stroke_group: 'Starts', event_distance: 'N/A' },
  { name: 'Elite Underwater Reference', stroke_group: 'Underwater', event_distance: 'N/A' },
  { name: 'Elite Turn and Breakout Reference', stroke_group: 'Turns', event_distance: 'N/A' },
  { name: 'Streamline Reference', stroke_group: 'Fundamentals', event_distance: 'N/A' },
];