export const FEATURE_READINESS_STATUSES = ['ready', 'partial', 'blocked', 'preview', 'disabled'];
export const FEATURE_READINESS_SEVERITIES = ['info', 'warning', 'critical'];

export const FEATURE_READINESS = {
  aiReview: {
    id: 'aiReview',
    label: 'AI Review',
    status: 'partial',
    severity: 'critical',
    userMessage: 'AI Review is available with a manual coach review exit path while worker reliability is being hardened.',
    coachAction: 'If processing is slow or evidence is weak, continue in Coach Studio and retry AI later.',
    internalNote: 'Do not present worker acceptance as completed analysis.',
    pilotReady: false,
  },
  analysisChecklist: {
    id: 'analysisChecklist',
    label: 'Analysis focus checklist',
    status: 'partial',
    severity: 'warning',
    userMessage: 'Focus selections prepare review context. Starts, turns, and race skills remain manual coach focus areas.',
    coachAction: 'Choose the areas you want to inspect, then verify every observation in Coach Studio.',
    internalNote: 'Credit display is estimate-only; no charging enforcement is active.',
    pilotReady: false,
  },
  consentRecords: {
    id: 'consentRecords',
    label: 'Consent records',
    status: 'partial',
    severity: 'critical',
    userMessage: 'Consent records depend on the safeguarding migration being available.',
    coachAction: 'Do not upload or process footage for a known minor unless granted consent can be confirmed.',
    internalNote: 'REQUIRE_CONSENT remains default-off; unavailable consent data must never be presented as granted.',
    pilotReady: false,
  },
  coachFeedback: {
    id: 'coachFeedback',
    label: 'Coach feedback',
    status: 'partial',
    severity: 'warning',
    userMessage: 'Pilot feedback is saved on the current device and can be copied for support.',
    coachAction: 'Copy the feedback summary and send it to support after the pilot session.',
    internalNote: 'Do not show a sent state until a real email provider confirms delivery.',
    pilotReady: false,
  },
  coachStudio: {
    id: 'coachStudio',
    label: 'Coach Studio',
    status: 'partial',
    severity: 'warning',
    userMessage: 'Core manual review, findings, drills, and reports are available; drawing and guided flow remain in pilot refinement.',
    coachAction: 'Use timestamp notes whenever drawing controls are not suitable for the session.',
    internalNote: 'Manual review must remain independent of AI success.',
    pilotReady: false,
  },
  drawingTools: {
    id: 'drawingTools',
    label: 'Drawing tools',
    status: 'partial',
    severity: 'warning',
    userMessage: 'Coach Draw is in pilot refinement and may be less comfortable on some devices.',
    coachAction: 'Use timestamp notes if drawing is not suitable, and include only coach-selected annotations in reports.',
    internalNote: 'Never block report completion on an annotation.',
    pilotReady: false,
  },
  drillLibrary: {
    id: 'drillLibrary',
    label: 'Drill Library',
    status: 'partial',
    severity: 'warning',
    userMessage: 'Stroke drill packs are available; starts, turns, and underwater sets are still being expanded.',
    coachAction: 'Use available drills or add a coach-written drill when a category is still being rebuilt.',
    internalNote: 'Empty categories must show an honest planned-content state.',
    pilotReady: false,
  },
  eliteStudio: {
    id: 'eliteStudio',
    label: 'Elite Studio',
    status: 'preview',
    severity: 'warning',
    userMessage: 'Elite Studio is a preview module and is not part of the coach pilot workflow.',
    coachAction: 'Use Coach Studio for current reviews. Treat Elite tools as internal prototypes only.',
    internalNote: 'Owner/admin only; no live measurement or production 3D claims.',
    pilotReady: false,
  },
  reports: {
    id: 'reports',
    label: 'Coach-approved reports',
    status: 'ready',
    severity: 'info',
    userMessage: 'Coach-approved findings and selected report evidence can be finalised and shared securely.',
    coachAction: 'Review every AI-assisted draft before finalising or sharing.',
    internalNote: 'Public report sanitisation remains mandatory.',
    pilotReady: true,
  },
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    status: 'ready',
    severity: 'info',
    userMessage: 'The main coach dashboard and navigation are available for controlled pilot use.',
    coachAction: 'Use the review queue to continue work that needs coach attention.',
    internalNote: 'Backend-assisted cards must keep clear empty and error states.',
    pilotReady: true,
  },
  publicSite: {
    id: 'publicSite',
    label: 'Public website',
    status: 'ready',
    severity: 'info',
    userMessage: 'Public product and trust pages are available without exposing private coach or swimmer data.',
    coachAction: 'Use the sample report for demonstration; use secure shared links for real reports.',
    internalNote: 'Pilot recovery warnings must not appear on public marketing routes.',
    pilotReady: true,
  },
};

export function getFeatureReadiness(featureId) {
  return FEATURE_READINESS[featureId] || null;
}

export function listPilotBlockers() {
  return Object.values(FEATURE_READINESS).filter(feature => !feature.pilotReady);
}
