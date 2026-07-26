export const PLAN_KEYS = {
  FREE_DEMO: 'free_demo',
  COACH_STUDIO: 'coach_studio',
  AI_ASSIST: 'ai_assist',
  CLUB_PRO: 'club_pro',
  ELITE_LAB: 'elite_lab',
};

export const PLAN_DEFINITIONS = {
  [PLAN_KEYS.FREE_DEMO]: {
    key: PLAN_KEYS.FREE_DEMO,
    label: 'Free Demo',
    shortLabel: 'Demo',
    description: 'Explore public pages, sample reports, and future trial access.',
    summary: 'Public exploration and sample report preview.',
    ctaLabel: 'Request access',
  },
  [PLAN_KEYS.COACH_STUDIO]: {
    key: PLAN_KEYS.COACH_STUDIO,
    label: 'Coach Studio',
    shortLabel: 'Coach Studio',
    description: 'Manual video review, key moments, Coach Draw, manual findings, drill suggestions, and shared reports.',
    summary: 'Base coach review workflow without relying on AI.',
    ctaLabel: 'Join pilot',
  },
  [PLAN_KEYS.AI_ASSIST]: {
    key: PLAN_KEYS.AI_ASSIST,
    label: 'AI Assist',
    shortLabel: 'AI Assist',
    description: 'AI draft findings, AI review credits, quality/fallback messaging, and coach approval workflow.',
    summary: 'Paid AI accelerator for coach-reviewed findings.',
    ctaLabel: 'Request AI Assist',
  },
  [PLAN_KEYS.CLUB_PRO]: {
    key: PLAN_KEYS.CLUB_PRO,
    label: 'Club Pro',
    shortLabel: 'Club Pro',
    description: 'Club workspace, squads, multi-coach roles, progress history, and club report management.',
    summary: 'Club workflow layer for squads and staff.',
    ctaLabel: 'Request club pilot',
  },
  [PLAN_KEYS.ELITE_LAB]: {
    key: PLAN_KEYS.ELITE_LAB,
    label: 'Advanced AI Analysis',
    shortLabel: 'AI Analysis',
    description: 'Future premium reference comparison, multi-angle review, priority AI, and advanced exports.',
    summary: 'Future premium lab workflow. Not a live measurement tool.',
    ctaLabel: 'Request access',
  },
};

export const FEATURE_GATES = {
  manual_coach_studio: {
    label: 'Coach Studio',
    requiredPlan: PLAN_KEYS.COACH_STUDIO,
    allowedPlans: [PLAN_KEYS.COACH_STUDIO, PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Coach Studio is part of the base coach review workflow.',
    ctaLabel: 'Join pilot',
  },
  shared_reports: {
    label: 'Shared reports',
    requiredPlan: PLAN_KEYS.COACH_STUDIO,
    allowedPlans: [PLAN_KEYS.COACH_STUDIO, PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Shared reports are part of Coach Studio and above.',
    ctaLabel: 'Request access',
  },
  coach_draw: {
    label: 'Coach Draw',
    requiredPlan: PLAN_KEYS.COACH_STUDIO,
    allowedPlans: [PLAN_KEYS.COACH_STUDIO, PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Coach Draw is included in Coach Studio and above.',
    ctaLabel: 'Join pilot',
  },
  key_moments: {
    label: 'Key moments',
    requiredPlan: PLAN_KEYS.COACH_STUDIO,
    allowedPlans: [PLAN_KEYS.COACH_STUDIO, PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Key moments are included in Coach Studio and above.',
    ctaLabel: 'Join pilot',
  },
  drill_library: {
    label: 'Drill Library',
    requiredPlan: PLAN_KEYS.COACH_STUDIO,
    allowedPlans: [PLAN_KEYS.COACH_STUDIO, PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'The corrective Drill Library is included in Coach Studio and above.',
    ctaLabel: 'Join pilot',
  },
  swimmer_squads: {
    label: 'Swimmers and squads',
    requiredPlan: PLAN_KEYS.CLUB_PRO,
    allowedPlans: [PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Squad workflows are part of Club Pro.',
    ctaLabel: 'Request club pilot',
  },
  ai_review: {
    label: 'AI Review',
    requiredPlan: PLAN_KEYS.AI_ASSIST,
    allowedPlans: [PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'AI Assist is a premium accelerator. Manual Coach Studio review remains available.',
    ctaLabel: 'Request AI Assist',
  },
  ai_review_credits: {
    label: 'AI review credits',
    requiredPlan: PLAN_KEYS.AI_ASSIST,
    allowedPlans: [PLAN_KEYS.AI_ASSIST, PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'AI review credits are being prepared for paid pilot plans.',
    ctaLabel: 'Request AI Assist',
  },
  ai_priority_queue: {
    label: 'Priority AI queue',
    requiredPlan: PLAN_KEYS.ELITE_LAB,
    allowedPlans: [PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Priority AI queue is planned for future analysis workflows.',
    ctaLabel: 'Request access',
  },
  advanced_progress: {
    label: 'Advanced progress',
    requiredPlan: PLAN_KEYS.CLUB_PRO,
    allowedPlans: [PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Advanced progress tools are part of Club Pro and above.',
    ctaLabel: 'Request club pilot',
  },
  premium_pdf_export: {
    label: 'Premium exports',
    requiredPlan: PLAN_KEYS.ELITE_LAB,
    allowedPlans: [PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Premium export controls will be part of future plan settings. Browser print remains available.',
    ctaLabel: 'Discuss AI Analysis',
  },
  club_workspace: {
    label: 'Club workspace',
    requiredPlan: PLAN_KEYS.CLUB_PRO,
    allowedPlans: [PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Club workspace features are part of Club Pro.',
    ctaLabel: 'Request club pilot',
  },
  multi_coach_roles: {
    label: 'Multi-coach roles',
    requiredPlan: PLAN_KEYS.CLUB_PRO,
    allowedPlans: [PLAN_KEYS.CLUB_PRO, PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Multi-coach roles are part of Club Pro.',
    ctaLabel: 'Request club pilot',
  },
  multi_angle_review: {
    label: 'Multi-angle review',
    requiredPlan: PLAN_KEYS.ELITE_LAB,
    allowedPlans: [PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Multi-angle review is a future analysis workflow. Current AI processes the primary angle only.',
    ctaLabel: 'Request access',
  },
  elite_3d_comparison: {
    label: 'Reference comparison',
    requiredPlan: PLAN_KEYS.ELITE_LAB,
    allowedPlans: [PLAN_KEYS.ELITE_LAB],
    lockedMessage: 'Reference comparison is a future premium workflow, not a live measurement tool.',
    ctaLabel: 'Request access',
  },
};

export const AI_CREDIT_COPY = {
  manualReport: 'Manual Coach Studio review uses 0 AI credits.',
  standardReview: 'A standard AI Review is planned to use 1 AI credit.',
  futureVariable: 'Longer, high-resolution, and multi-angle analysis reviews may use different future credit rules.',
  pilotUnknown: 'AI credits are being prepared for pilot plans. Manual Coach Studio review remains available without AI credits.',
};

const PLAN_FIELD_NAMES = ['plan_key', 'plan', 'tier', 'subscription_plan', 'billing_plan', 'access_plan'];

export function getPlanKey(subject) {
  if (!subject || typeof subject !== 'object') return null;
  for (const field of PLAN_FIELD_NAMES) {
    const value = subject[field];
    if (value && PLAN_DEFINITIONS[value]) return value;
  }
  return null;
}

export function getPlanLabel(planKey) {
  return PLAN_DEFINITIONS[planKey]?.label || 'Pilot plan not assigned';
}

// Frontend feature gates are for product UX only. Real paid launch must enforce
// entitlements server-side before billing, AI dispatch, exports, or premium tools.
export function getFeatureGateState(featureKey, planKey) {
  const gate = FEATURE_GATES[featureKey];
  if (!gate) {
    return {
      featureKey,
      isAllowed: true,
      isKnownFeature: false,
      isEnforced: false,
      label: 'Feature',
      message: 'No feature gate configured.',
      requiredPlanLabel: '',
      ctaLabel: 'Request access',
    };
  }

  if (!planKey) {
    return {
      featureKey,
      isAllowed: true,
      isKnownFeature: true,
      isEnforced: false,
      label: gate.label,
      message: 'Plan and credit enforcement is being prepared for pilot accounts.',
      requiredPlanLabel: getPlanLabel(gate.requiredPlan),
      ctaLabel: gate.ctaLabel,
    };
  }

  const isAllowed = gate.allowedPlans.includes(planKey);
  return {
    featureKey,
    isAllowed,
    isKnownFeature: true,
    isEnforced: true,
    label: gate.label,
    message: isAllowed ? 'Available on this plan.' : gate.lockedMessage,
    requiredPlanLabel: getPlanLabel(gate.requiredPlan),
    ctaLabel: gate.ctaLabel,
  };
}

export function isFeatureAllowed(featureKey, planKey) {
  return getFeatureGateState(featureKey, planKey).isAllowed;
}

// ── Report attribution ───────────────────────────────────────────────────────
// "Powered by Swim Sight 3D" is fair on free/pilot tiers, but a design audit
// flagged it as a liability once a club or national body hands the report to a
// parent under their own branding. Paid club tiers therefore carry the club's
// identity alone. Derived from the existing `clubs.plan_key` — no schema change.
const ATTRIBUTION_FREE_PLANS = [PLAN_KEYS.FREE_DEMO, PLAN_KEYS.COACH_STUDIO];

/** True when reports for this club should show the "Powered by" line. */
export function showsReportAttribution(planKey) {
  if (!planKey) return true;                       // unknown plan: attribute (safe default)
  return ATTRIBUTION_FREE_PLANS.includes(planKey);
}
