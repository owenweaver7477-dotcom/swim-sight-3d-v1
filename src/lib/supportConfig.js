// Every support route in the app resolves through this one constant.
//
// ⚠️ The default MUST be an inbox that actually exists. This briefly defaulted to the
// branded support@swimsight3d.com, which has no mailbox yet — so on a live product every
// coach who clicked "contact support" emailed a black hole, silently. Reverted 2026-07-26.
// Switch the default to the branded address only once that mailbox (or a forward to this
// inbox) is real; until then it can be pointed anywhere via VITE_SUPPORT_EMAIL in Vercel,
// with no code change and no deploy of this file.
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'swimsight3d.support@gmail.com';
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
// Public-site pilot booking CTA — a plain email for now (no form/booking tool yet).
export const PILOT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Swim Sight 3D pilot enquiry')}`;
// Auth screens are the one place a user cannot reach any in-app help: if they cannot
// sign in, every other support route is behind the login wall. AuthLayout renders this
// on all four (log in, register, forgot password, reset password) so it can never drift.
export const SIGN_IN_HELP_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Swim Sight 3D sign-in help')}`;

export const SUPPORT_COPY = {
  pilot: 'Feedback opens an email to Swim Sight 3D support so nothing is lost during the pilot.',
  saved: 'Feedback saved in Swim Sight 3D. Email delivery is not configured, so open the prepared support email to send it.',
  recovery: 'Need help recovering this review? Contact Swim Sight 3D support.',
};

function safeValue(value, fallback = 'Not provided') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export function getDeviceSummary() {
  if (typeof navigator === 'undefined') return 'Unavailable';
  return `${navigator.platform || 'Browser'} | ${navigator.userAgent || 'Unknown browser'}`;
}

export function buildFeedbackEmailBody({
  clubName,
  coachName,
  coachEmail,
  pageArea,
  severity,
  happened,
  expected,
  device,
  currentUrl,
  timestamp,
  aiJobInvolved,
  reportInvolved,
  extraLines = [],
} = {}) {
  return [
    'Swim Sight 3D pilot support feedback',
    '',
    `Club: ${safeValue(clubName)}`,
    `Coach: ${safeValue(coachName)}`,
    `Coach email: ${safeValue(coachEmail)}`,
    `Page / area: ${safeValue(pageArea)}`,
    `Severity: ${safeValue(severity, 'Not selected')}`,
    `What happened: ${safeValue(happened)}`,
    `What was expected: ${safeValue(expected)}`,
    `Browser / device: ${safeValue(device || getDeviceSummary())}`,
    `Current URL: ${safeValue(currentUrl || (typeof window !== 'undefined' ? window.location.href : 'Unavailable'))}`,
    `Timestamp: ${safeValue(timestamp || new Date().toISOString())}`,
    `AI job involved: ${safeValue(aiJobInvolved, 'Unknown')}`,
    `Report / share / PDF involved: ${safeValue(reportInvolved, 'Unknown')}`,
    ...extraLines.filter(Boolean),
    '',
    'Please do not include swimmer medical information, guardian contact details, signed video links, or other private data.',
  ].join('\n');
}

export function buildFeedbackMailto({ subject = 'Swim Sight 3D pilot feedback', ...details } = {}) {
  const body = buildFeedbackEmailBody(details);
  return `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
