import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OUTPUT_AVAILABILITY,
  buildAthleteProfileReadiness,
  buildReportOutputPlan,
  getReportOutput,
  getReportOutputState,
} from '../src/lib/aiReportOutputs.js';
import { validateAIReportOutputRequest } from '../api/_lib/aiReportOutputSelection.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

const selector = await read('src/components/analysis/AIReportOutputSelector.jsx');
const outputCatalog = await read('src/lib/aiReportOutputs.js');
const analyse = await read('src/pages/Analyse.jsx');
const trigger = await read('api/_lib/ai/triggerHandler.js');
const outputValidation = await read('api/_lib/aiReportOutputSelection.js');
const queue = await read('api/_lib/aiQueue.js');
const callback = await read('api/_lib/ai/callbackHandler.js');
const sharedPage = await read('src/pages/SharedReportPage.jsx');
const sharedRoute = await read('api/shared-reports/[token].js');

assert.match(selector, /Choose AI report outputs/);
assert.match(selector, /Body mass \/ weight/);
assert.match(selector, /Estimated processing time/);
assert.match(outputCatalog, /Manual coach review only/);
assert.match(selector, /AI-assisted draft/);
assert.match(analyse, /selected_report_outputs: reportOutputPlan\.selected/);
assert.match(analyse, /estimated_credit_cost: reportOutputPlan\.estimatedCredits/);
assert.match(trigger, /validateAIReportOutputRequest/);
assert.match(outputValidation, /Choose at least one AI report output/);

const drag = getReportOutput('estimated_drag_force');
assert.ok(drag, 'Estimated drag force output must exist');
assert.equal(drag.estimateOnly, true);
assert.deepEqual(drag.requirements, ['body_mass', 'height', 'calibration', 'side_view']);

const unavailable = buildAthleteProfileReadiness({
  athleteProfile: {},
  stroke: 'Freestyle',
  cameraAngle: 'Side',
  videoDurationSeconds: 10,
  features: { estimated_drag_enabled: true },
});
assert.equal(getReportOutputState(drag, unavailable).state, OUTPUT_AVAILABILITY.REQUIRES_ATHLETE_PROFILE);
assert.equal(buildReportOutputPlan({ selectedOutputIds: ['estimated_drag_force'], readiness: unavailable }).valid, false);

const available = buildAthleteProfileReadiness({
  athleteProfile: {
    body_mass_kg: 70,
    approximate_height_cm: 180,
    pool_length_m: 25,
    calibration_available: true,
  },
  stroke: 'Freestyle',
  cameraAngle: 'Side',
  videoDurationSeconds: 10,
  features: { estimated_drag_enabled: true },
});
const availablePlan = buildReportOutputPlan({ selectedOutputIds: ['estimated_drag_force'], readiness: available });
assert.equal(availablePlan.valid, true);
assert.deepEqual(availablePlan.estimateOnly, ['estimated_drag_force']);

const upload = { stroke_type: 'Freestyle', camera_angle: 'Side', duration_seconds: 10 };
const missingSelection = validateAIReportOutputRequest({ requestBody: {}, upload, env: {} });
assert.equal(missingSelection.valid, false);
const coreSelection = validateAIReportOutputRequest({
  requestBody: {
    selected_report_outputs: ['body_line_analysis'],
    coach_confirmed_draft_ai: true,
  },
  upload,
  env: {},
});
assert.equal(coreSelection.valid, true);
const lockedDrag = validateAIReportOutputRequest({
  requestBody: {
    selected_report_outputs: ['estimated_drag_force'],
    coach_confirmed_draft_ai: true,
  },
  upload,
  env: { ENABLE_ESTIMATED_DRAG: 'true' },
});
assert.equal(lockedDrag.valid, false);

for (const publicSource of [sharedPage, sharedRoute]) {
  assert.doesNotMatch(publicSource, /athlete_profile_inputs|body_mass_kg|approximate_height_cm|swimmer_mass_kg|swimmer_height_cm/);
}

assert.doesNotMatch(queue, /20\s*\*\s*1000|(?<!\d)20_000(?!\d)|AI_SERVER_TRIGGER_TIMEOUT_MS\s*=\s*20000/);
assert.match(queue, /worker_acceptance_delayed/);
assert.match(callback, /late_callback_after_cancel_requested/);

console.log('AI report output selection check passed.');
