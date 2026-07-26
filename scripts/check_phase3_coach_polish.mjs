import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const supportConfig = await read('src/lib/supportConfig.js');
const feedbackForm = await read('src/components/pilot/CoachPilotFeedbackForm.jsx');
const feedbackModal = await read('src/components/coach-testing/FeedbackModal.jsx');
// BugReportModal was part of the (dead, base44-backed) coach-testing island removed
// in the #7 cleanup; the central-support-email rule below is still enforced across
// the live support surfaces (supportConfig, feedbackForm, feedbackModal).
const coachWorkflow = await read('src/components/coach-studio/CoachStudioWorkflowPanel.jsx');
const coachDraw = await read('src/components/annotations/CoachDrawStudio.jsx');
const drillLibrary = await read('src/pages/DrillLibrary.jsx');
const defaultDrills = await read('src/lib/defaultDrills.js');
// The live route is /analyse -> src/pages/Analyse.jsx. This used to read the
// orphaned src/pages/Analysis.jsx, so it was guarding a file the app never
// loaded and would have passed through any regression on the real page.
const analysisPage = await read('src/pages/Analyse.jsx');
const pilotReadinessGate = await read('src/components/pilot/PilotReadinessGate.jsx');
const featureReadiness = await read('src/lib/featureReadiness.js');
const aiReportPage = await read('src/pages/AIReportPage.jsx');

for (const source of [supportConfig, feedbackForm, feedbackModal]) {
  assert.match(source, /swimsight3d\.support@gmail\.com|SUPPORT_EMAIL/, 'support routing must use the central support email');
}

assert.match(feedbackForm, /Support route/);
assert.match(feedbackForm, /Saving keeps a local copy on this device; it does not send automatically/i);
assert.match(feedbackForm, /Club name|Coach name|Browser\/device|Current URL|Timestamp|AI job/i);
assert.doesNotMatch(feedbackForm, /medical diagnosis|diagnose/i);

for (const section of [
  'Session setup',
  'Video and angle review',
  'Focus checklist',
  'Manual annotation',
  'AI-assisted draft review',
  'Drills and next focus',
  'Report approval',
  'Share / export',
]) {
  assert.match(coachWorkflow, new RegExp(section), `coach studio workflow missing ${section}`);
}

for (const status of ['Not started', 'In progress', 'Complete', 'Blocked', 'Preview-only']) {
  assert.match(coachWorkflow, new RegExp(status), `coach workflow missing status ${status}`);
}

assert.match(coachWorkflow, /manual coach review/i);
assert.match(aiReportPage, /CoachStudioWorkflowPanel/);

for (const tool of ['Coach Draw', 'Draw', 'Save', 'Cancel', 'Key frame']) {
  assert.match(coachDraw, new RegExp(tool), `drawing tools missing ${tool}`);
}
assert.match(coachDraw, /controlsExpanded|Show|Hide|AnnotationCanvas/i);
assert.match(coachDraw, /Coach Draw|coach-created annotation/i);

for (const category of ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'Starts', 'Turns', 'Underwater', 'General']) {
  assert.match(drillLibrary, new RegExp(category), `drill library missing ${category}`);
}

// REPOINTED. This used to assert these phase strings appeared in DrillLibrary.jsx's
// hardcoded PHASES array — and four of them ('Set position', 'Reaction and entry',
// 'Underwater breakout', 'Wall contact') were MISCASED against the drill data, which
// stores 'Set Position', 'Wall Contact' and so on. The filter compares exactly, so those
// four chips matched zero drills. The guard was pinning the bug in place: it would have
// failed anyone who corrected the casing, and passed the broken state forever.
//
// The intent was "the library covers the starts/turns/underwater phases", so it now
// asserts that against the DATA, in the data's own casing, and separately requires the UI
// to DERIVE its chips from that data rather than keep a second list that can drift again.
for (const phase of ['Set Position', 'Reaction and Entry', 'Streamline', 'Underwater Breakout', 'Approach', 'Rotation', 'Wall Contact', 'Push-off']) {
  assert.match(defaultDrills, new RegExp(`phase: '${phase}'`), `drill data missing phase ${phase}`);
}
// Two assertions, because one was not enough: a first attempt matched the mere substring
// "phaseOptionsFrom", so renaming the helper to phaseOptionsFromUNUSED and hardcoding the
// chips still passed. Require the derivation to EXIST and to be what the chips render from.
assert.match(
  drillLibrary,
  /new Set\(drills\.map\(\(d\) => d\.phase\)/,
  'DrillLibrary must derive its phase filter options from the loaded drills. A hardcoded '
  + 'list drifted out of sync with the data once already: 8 of 23 options matched no drill '
  + 'and 7 real phases (incl. "Kick Recovery", 7 drills) were unreachable by any chip.',
);
assert.match(
  drillLibrary,
  /\{phaseOptions\.map\(/,
  'The phase chips must render from the derived phaseOptions. Deriving a list and then '
  + 'rendering a different one would reintroduce exactly the drift this replaced.',
);

for (const detail of ['purpose', 'when_to_use', 'setup', 'execution_steps', 'common_mistakes', 'coaching_cue', 'duration_or_reps', 'difficulty', 'fault_tags', 'three_d_demo_status']) {
  assert.match(defaultDrills, new RegExp(detail), `drill data missing ${detail}`);
}

// Analyse.jsx keys these singular (Start/Turn) and adds Underwater/Breakout —
// the orphaned page this used to read still said Starts/Turns.
for (const standard of [
  'Freestyle',
  'Breaststroke',
  'Backstroke',
  'Butterfly',
  'Start',
  'Turn',
  'Underwater',
  'Breakout',
  'STROKE_PHASES',
  'FAULT_TAGS',
  'coach_sees',
  'why_it_matters',
]) {
  assert.match(analysisPage, new RegExp(standard), `technical standards missing ${standard}`);
}

assert.match(featureReadiness, /Elite Studio/);
assert.match(featureReadiness, /preview module|preview-only|Preview/i);
assert.match(pilotReadinessGate, /Needs production verification before live pilot AI use|Backend worker/i);

const unsafeClaims = /guaranteed AI|perfect AI|AI replaces coach|true 3D analysis complete|validated 3D|measured drag/i;
for (const [name, source] of [
  ['supportConfig', supportConfig],
  ['feedbackForm', feedbackForm],
  ['coachWorkflow', coachWorkflow],
  ['coachDraw', coachDraw],
  ['drillLibrary', drillLibrary],
  ['analysisPage', analysisPage],
  ['pilotReadinessGate', pilotReadinessGate],
  ['featureReadiness', featureReadiness],
]) {
  assert.equal(unsafeClaims.test(source), false, `unsafe public claim found in ${name}`);
}

console.log('Phase 3 coach polish check passed.');
