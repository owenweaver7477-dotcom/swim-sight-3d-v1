import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const supportConfig = await read('src/lib/supportConfig.js');
const feedbackForm = await read('src/components/pilot/CoachPilotFeedbackForm.jsx');
const feedbackModal = await read('src/components/coach-testing/FeedbackModal.jsx');
const bugReportModal = await read('src/components/coach-testing/BugReportModal.jsx');
const coachWorkflow = await read('src/components/coach-studio/CoachStudioWorkflowPanel.jsx');
const coachDraw = await read('src/components/annotations/CoachDrawStudio.jsx');
const drillLibrary = await read('src/pages/DrillLibrary.jsx');
const defaultDrills = await read('src/lib/defaultDrills.js');
const analysisPage = await read('src/pages/Analysis.jsx');
const pilotReadinessGate = await read('src/components/pilot/PilotReadinessGate.jsx');
const featureReadiness = await read('src/lib/featureReadiness.js');
const aiReportPage = await read('src/pages/AIReportPage.jsx');

for (const source of [supportConfig, feedbackForm, feedbackModal, bugReportModal]) {
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

for (const phase of ['Set position', 'Reaction and entry', 'Streamline', 'Underwater breakout', 'Approach', 'Rotation', 'Wall contact', 'Push-off']) {
  assert.match(drillLibrary, new RegExp(phase), `drill library missing phase ${phase}`);
}

for (const detail of ['purpose', 'when_to_use', 'setup', 'execution_steps', 'common_mistakes', 'coaching_cue', 'duration_or_reps', 'difficulty', 'fault_tags', 'three_d_demo_status']) {
  assert.match(defaultDrills, new RegExp(detail), `drill data missing ${detail}`);
}

for (const standard of [
  'Freestyle',
  'Breaststroke',
  'Backstroke',
  'Butterfly',
  'Starts',
  'Turns',
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
