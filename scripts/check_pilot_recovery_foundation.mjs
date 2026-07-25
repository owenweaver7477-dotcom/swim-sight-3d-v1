import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const featureReadiness = await read('src/lib/featureReadiness.js');
const analysePage = await read('src/pages/Analyse.jsx');
const aiReportPage = await read('src/pages/AIReportPage.jsx');
const videoLibrary = await read('src/components/analysis/VideoLibrary.jsx');
const pilotWarning = await read('src/components/status/PilotReadinessWarning.jsx');
const recoveryCard = await read('src/components/status/RecoveryActionCard.jsx');
const aiCreditIndicator = await read('src/components/credits/AICreditIndicator.jsx');
const focusChecklist = await read('src/components/analysis/AnalysisFocusChecklist.jsx');
const coachStudioWorkflow = await read('src/components/coach-studio/CoachStudioWorkflowPanel.jsx');
const finaliseGate = await read('src/components/ai-report/FinaliseQualityGate.jsx');
const publicReportSafety = await read('scripts/check_public_report_safety.mjs');

for (const feature of [
  'aiReview',
  'analysisChecklist',
  'consentRecords',
  'coachFeedback',
  'coachStudio',
  'drawingTools',
  'drillLibrary',
  'eliteStudio',
  'reports',
  'dashboard',
  'publicSite',
]) {
  assert.match(featureReadiness, new RegExp(`${feature}:\\s*\\{`), `feature readiness missing ${feature}`);
}

for (const label of ['ready', 'partial', 'blocked', 'preview', 'disabled']) {
  assert.match(featureReadiness, new RegExp(`['"]${label}['"]`), `missing feature status label ${label}`);
}

assert.match(pilotWarning, /Pilot recovery mode/);
assert.match(pilotWarning, /manual coach review/i);
assert.match(recoveryCard, /support/i);
assert.match(recoveryCard, /Continue manual review|manual review/);

// The "Pilot recovery mode" banner no longer renders on the coach workflow screens
// (Analyse / AI review / reviews list) — a product audit found that surfacing internal
// operational state to coaches was the app's biggest trust leak. It now lives only on
// the internal PilotLaunchPage. What must still hold is the BEHAVIOUR this guard exists
// to protect: every AI failure path still hands the coach a manual-review route, which
// the assertions below (and the aiReportPage recovery states) pin directly.
assert.match(analysePage, /AnalysisFocusChecklist/);
assert.match(analysePage, /AICreditIndicator/);
assert.match(analysePage, /Continue manual coach review|manual coach review/i);
assert.match(analysePage, /Consent records are currently unavailable|consent/i);

assert.match(videoLibrary, /RecoveryActionCard/);
assert.match(videoLibrary, /AI processing is taking longer than expected/);
assert.match(videoLibrary, /continue manual coach review/i);

// (Banner removed from this workflow screen too — see the note above.)
// The review page used to render <RecoveryActionCard>; it now renders an inline
// status card per AI state. Pin the recovery *behaviour* rather than the old
// component name: every failure state must still say the video survived and
// hand the coach a route back into manual review.
for (const recoveryState of [
  'AI review did not complete',
  'AI worker did not accept the job yet',
  'Manual review recommended',
]) {
  assert.match(aiReportPage, new RegExp(recoveryState), `AI review page missing recovery state: ${recoveryState}`);
}
assert.match(aiReportPage, /The video is still available\./);
assert.match(aiReportPage, /label: 'Open Coach Studio'/);
assert.match(aiReportPage, /label: 'Retry AI review'/);
assert.match(aiReportPage, /AI review not reliable enough|Manual coach review required|manual coach review/i);
assert.match(aiReportPage, /no AI result is published without coach approval/i);

assert.match(aiCreditIndicator, /Estimate only|estimate/i);
assert.match(aiCreditIndicator, /No AI credits (are )?used in manual review/i);

for (const focus of ['Body line', 'Kick', 'Pull', 'Timing', 'Starts', 'Turns', 'Race skills', 'Custom coach focus']) {
  assert.match(focusChecklist, new RegExp(focus), `analysis focus checklist missing ${focus}`);
}

for (const step of ['Session setup', 'Focus checklist', 'Video and angle review', 'AI-assisted draft review', 'Report approval', 'Share / export']) {
  assert.match(coachStudioWorkflow, new RegExp(step), `coach studio workflow missing ${step}`);
}

assert.match(finaliseGate, /coach-approved/i);
assert.match(finaliseGate, /excludes private notes, rejected findings, and unapproved annotations/i);
assert.match(publicReportSafety, /findUnsafePublicReportPaths/);
assert.match(publicReportSafety, /sanitizePublicReportPayload/);
assert.match(publicReportSafety, /Rejected findings must be removed/);

console.log('Pilot recovery foundation check passed.');
