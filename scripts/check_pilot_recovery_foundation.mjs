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

assert.match(analysePage, /PilotReadinessWarning/);
assert.match(analysePage, /AnalysisFocusChecklist/);
assert.match(analysePage, /AICreditIndicator/);
assert.match(analysePage, /Continue manual coach review|manual coach review/i);
assert.match(analysePage, /Consent records are currently unavailable|consent/i);

assert.match(videoLibrary, /RecoveryActionCard/);
assert.match(videoLibrary, /AI processing is taking longer than expected/);
assert.match(videoLibrary, /continue manual coach review/i);

assert.match(aiReportPage, /PilotReadinessWarning/);
assert.match(aiReportPage, /RecoveryActionCard/);
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
