import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFile(path.join(root, relativePath), 'utf8');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else if (/\.(?:js|jsx|md)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

const supportConfig = await read('src/lib/supportConfig.js');
assert.match(supportConfig, /swimsight3d\.support@gmail\.com/);
assert.match(supportConfig, /buildFeedbackMailto/);
for (const file of [
  'src/components/pilot/CoachPilotFeedbackForm.jsx',
  'src/components/coach-testing/FeedbackModal.jsx',
  'src/components/coach-testing/BugReportModal.jsx',
  'src/components/status/RecoveryActionCard.jsx',
]) {
  const source = await read(file);
  assert.match(source, /supportConfig/, `Central support configuration is not used by ${file}`);
}

const workflow = await read('src/components/coach-studio/CoachStudioWorkflowPanel.jsx');
for (const section of [
  'Session setup', 'Video and angle review', 'Focus checklist', 'Manual annotation',
  'AI-assisted draft review', 'Technical standards', 'Drills and next focus',
  'Report approval', 'Share / export',
]) {
  assert.ok(workflow.includes(section), `Missing Coach Studio workflow section: ${section}`);
}
for (const status of ['Not started', 'In progress', 'Complete', 'Blocked', 'Preview-only']) {
  assert.ok(workflow.includes(status), `Missing Coach Studio status: ${status}`);
}
assert.match(workflow, /Local pilot checklist/);
assert.match(workflow, /Manual review available if AI is unavailable/);

const drills = await read('src/lib/defaultDrills.js');
for (const category of ['Starts', 'Turns']) assert.match(drills, new RegExp(`stroke: '${category}'`));
for (const phase of ['Set Position', 'Reaction and Entry', 'Streamline', 'Underwater Breakout', 'Approach', 'Rotation', 'Wall Contact', 'Push-off', 'Streamline / Breakout']) {
  assert.ok(drills.includes(`phase: '${phase}'`), `Missing start/turn drill phase: ${phase}`);
}
for (const field of ['purpose', 'when_to_use', 'setup', 'execution_steps', 'common_mistakes', 'coaching_cue', 'duration_or_reps', 'difficulty', 'fault_tags', 'three_d_demo_status']) {
  assert.ok(drills.includes(field), `Missing drill detail field: ${field}`);
}

const standards = await read('src/components/standards/defaultStandards.jsx');
for (const standard of [
  'Freestyle Body Line Standard', 'Freestyle Catch Standard', 'Freestyle Kick Timing Standard',
  'Breaststroke Body Line Standard', 'Breaststroke Kick Recovery Standard', 'Breaststroke Timing and Glide Standard',
  'Backstroke Hip Position Standard', 'Butterfly Second Kick Timing Standard',
  'Start Streamline Standard', 'Turn Push-Off and Breakout Standard',
]) {
  assert.ok(standards.includes(standard), `Missing technical standard: ${standard}`);
}
const standardsPage = await read('src/pages/TechnicalStandards.jsx');
assert.match(standardsPage, /Evidence and coaching framework/);
assert.match(standardsPage, /AI-assisted estimate/);
assert.match(standardsPage, /Preview-only/);

const toolbar = await read('src/components/annotations/AnnotationToolbar.jsx');
for (const tool of ['Select', 'Draw line', 'Arrow', 'Angle marker', 'Text note']) {
  assert.ok(toolbar.includes(tool), `Missing compact drawing tool: ${tool}`);
}
assert.match(toolbar, /Hide drawing tools/);
const canvas = await read('src/components/annotations/AnnotationCanvas.jsx');
assert.match(canvas, /Show drawing tools/);
assert.match(toolbar, /Coach annotation mode/);
assert.match(toolbar, /not AI-confirmed/);

const elite = await read('src/pages/EliteLabRoadmap.jsx');
assert.match(elite, /Preview-only/);
for (const module of ['3D reference model', 'Stroke phase comparison', 'Body-line overlay', 'Drill demonstration model', 'Elite timing library']) {
  assert.ok(elite.includes(module), `Missing Elite preview module: ${module}`);
}

const readiness = await read('src/components/pilot/PilotReadinessGate.jsx');
assert.match(readiness, /Needs production verification before live pilot AI use/);
assert.match(readiness, /Usable with manual fallback/);
assert.match(readiness, /Preview only/);
const appRoutes = await read('src/App.jsx');
const coachGuardIndex = appRoutes.indexOf('RoleProtectedRoute allowedRoles={COACH_APP_ROLES}');
const ownerGuardIndex = appRoutes.indexOf('RoleProtectedRoute allowedRoles={OWNER_ADMIN_ROLES}');
const pilotRouteIndex = appRoutes.indexOf('path="/pilot-launch"');
assert.ok(pilotRouteIndex > coachGuardIndex && pilotRouteIndex < ownerGuardIndex, 'Pilot launch must stay in the coach role route group');
const pilotPage = await read('src/pages/PilotLaunchPage.jsx');
assert.match(pilotPage, /\['owner', 'admin', 'coach'\]/);

const files = [
  ...await collectFiles(path.join(root, 'src')),
  ...await collectFiles(path.join(root, 'docs')),
];
const unsafeClaim = /guaranteed AI|perfect AI|AI replaces (?:the )?coach|true 3D analysis complete/gi;
for (const file of files) {
  const source = await readFile(file, 'utf8');
  assert.equal(unsafeClaim.test(source), false, `Unsafe product claim in ${path.relative(root, file)}`);
  unsafeClaim.lastIndex = 0;
  assert.equal(source.includes('swimsight3dsupport@gmail.com'), false, `Old support email remains in ${path.relative(root, file)}`);
}

console.log('Phase 3 coach polish check passed.');
console.log(`Workflow sections: 9; source/docs files checked: ${files.length}.`);
