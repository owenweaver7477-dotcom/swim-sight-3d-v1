import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FEATURE_READINESS,
  FEATURE_READINESS_SEVERITIES,
  FEATURE_READINESS_STATUSES,
} from '../src/lib/featureReadiness.js';
import { getConsentActionState } from '../src/lib/consentReadiness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredModules = [
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
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute));
    else if (/\.jsx?$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

for (const moduleId of requiredModules) {
  const feature = FEATURE_READINESS[moduleId];
  assert.ok(feature, `Missing readiness module: ${moduleId}`);
  assert.equal(feature.id, moduleId);
  assert.ok(FEATURE_READINESS_STATUSES.includes(feature.status), `Unapproved readiness status: ${feature.status}`);
  assert.ok(FEATURE_READINESS_SEVERITIES.includes(feature.severity), `Unapproved readiness severity: ${feature.severity}`);
  assert.equal(typeof feature.pilotReady, 'boolean');
}

const unavailableMinor = getConsentActionState({
  record: { is_minor: true, consent_status: 'none' },
  unavailable: true,
});
assert.equal(unavailableMinor.canUpload, false);
assert.equal(unavailableMinor.canStartAI, false);
assert.match(unavailableMinor.message, /Consent records are currently unavailable/i);

const warningSource = await read('src/components/status/PilotReadinessWarning.jsx');
assert.match(warningSource, /Use manual coach review if AI processing is unavailable/i);

const publicFiles = await collectFiles(path.join(root, 'src', 'pages', 'public'));
for (const file of publicFiles) {
  const source = await readFile(file, 'utf8');
  assert.equal(source.includes('PilotReadinessWarning'), false, `Pilot warning leaked into public page: ${path.relative(root, file)}`);
}

const videoLibrary = await read('src/components/analysis/VideoLibrary.jsx');
assert.match(videoLibrary, /AI processing is taking longer than expected/);
assert.match(videoLibrary, /Stop waiting and open Coach Studio/);
assert.match(videoLibrary, /True server cancellation is not available yet/);

const qualityGate = await read('src/components/ai-report/PlaceholderWarningBanner.jsx');
assert.match(qualityGate, /Continue with manual coach review/i);
assert.match(qualityGate, /upload clearer footage/i);

const focusChecklist = await read('src/components/analysis/AnalysisFocusChecklist.jsx');
for (const label of ['Body line', 'Kick', 'Pull', 'Timing', 'Starts', 'Turns', 'Race skills', 'Custom coach focus']) {
  assert.ok(focusChecklist.includes(label), `Missing analysis focus option: ${label}`);
}
assert.match(focusChecklist, /Manual focus only/);
assert.doesNotMatch(focusChecklist, /estimated_drag|ENABLE_ESTIMATED_DRAG|POSE_BACKEND|PHASE_ANALYSIS/);

const credits = await read('src/components/credits/AICreditIndicator.jsx');
assert.match(credits, /Estimate only/);
assert.match(credits, /No AI credits are used in manual review/);
assert.match(credits, /not enforced/);

const elitePreview = await read('src/pages/BiomechanicsHUD.jsx');
assert.match(elitePreview, /not pilot-ready yet/i);
assert.match(elitePreview, /preview module/i);

const drillLibrary = await read('src/pages/DrillLibrary.jsx');
for (const category of ['Starts', 'Turns', 'Underwater', 'General body line', 'Breaststroke', 'Freestyle', 'Backstroke', 'Butterfly']) {
  assert.ok(drillLibrary.includes(category), `Missing drill category: ${category}`);
}

console.log('Pilot recovery foundation check passed.');
console.log(`Readiness modules checked: ${requiredModules.length}; public pages checked: ${publicFiles.length}.`);
