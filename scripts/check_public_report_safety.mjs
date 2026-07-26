import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  findUnsafePublicReportPaths,
  sanitizePublicReportPayload,
} from '../src/lib/sanitizeAIReport.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readFixture(name) {
  const filePath = path.join(root, 'fixtures', 'public-report', name);
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function assertSanitized(payload, label) {
  const unsafePaths = findUnsafePublicReportPaths(payload);
  assert.deepEqual(unsafePaths, [], `${label} contains unsafe public fields: ${unsafePaths.join(', ')}`);
  assert.ok(payload.report, `${label} must contain a share-ready report`);
  assert.ok(payload.findings.every(finding => finding.approval_status === 'approved'));
  assert.ok(payload.annotations.every(annotation => annotation.include_in_report && annotation.is_public));
}

const safeFixture = await readFixture('safe.example.json');
const unsafeFixture = await readFixture('unsafe.example.json');
const supabaseRoute = await readFile(path.join(root, 'api', 'shared-reports', '[token].js'), 'utf8');
const base44Route = await readFile(path.join(root, 'base44', 'functions', 'getSharedReport', 'entry.ts'), 'utf8');

assert.deepEqual(findUnsafePublicReportPaths(safeFixture), [], 'Safe fixture should start clean');
assert.ok(findUnsafePublicReportPaths(unsafeFixture).length > 0, 'Unsafe fixture should exercise the detector');

const safeOutput = sanitizePublicReportPayload(safeFixture);
const cleanedUnsafeOutput = sanitizePublicReportPayload(unsafeFixture);
const clientResanitizedOutput = sanitizePublicReportPayload(safeOutput);

assertSanitized(safeOutput, 'Sanitized safe fixture');
assertSanitized(cleanedUnsafeOutput, 'Sanitized unsafe fixture');
assertSanitized(clientResanitizedOutput, 'Client re-sanitized fixture');
assert.ok(clientResanitizedOutput.annotations[0]?.rendered_svg?.startsWith('<svg'), 'Safe rendered annotations must survive client re-sanitization');
assert.equal(cleanedUnsafeOutput.findings.length, 1, 'Rejected findings must be removed');
assert.equal(cleanedUnsafeOutput.annotations.length, 0, 'Private annotations must be removed');
assert.equal(JSON.stringify(cleanedUnsafeOutput).includes('synthetic-secret'), false, 'Signed tokens must be removed');
assert.match(supabaseRoute, /link\.status !== 'active'/);
assert.match(base44Route, /!shareLink\.is_active/);
assert.match(supabaseRoute, /\['coach_approved', 'finalised', 'published', 'shared'\]\.includes\(report\.status\)/);
assert.match(base44Route, /shareableStatuses\.includes\(report\.status\)/);
assert.match(base44Route, /drag_items: \[\]/);
assert.doesNotMatch(base44Route, /coach_notes: d\.coach_notes/);

// ── Commercial tier must never reach a public share link ─────────────────────
// The "Powered by" line is decided server-side from the club's plan, but a share
// URL is viewable by anyone, so the plan/tier itself must never be emitted — only
// the resulting boolean. Feed a payload carrying every tier-ish field and assert
// none survive sanitization, while the boolean does.
const TIER_FIELDS = ['plan_key', 'plan', 'tier', 'subscription', 'billing_plan', 'plan_name'];
const tierProbe = sanitizePublicReportPayload({
  ...safeFixture,
  club: {
    ...(safeFixture.club || {}),
    name: 'Probe Club',
    show_attribution: false,
    ...Object.fromEntries(TIER_FIELDS.map((f) => [f, 'club_pro'])),
  },
});
const tierProbeJson = JSON.stringify(tierProbe);
for (const field of TIER_FIELDS) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(tierProbe.club || {}, field), false,
    `Public payload must not expose the club's commercial tier ("${field}")`,
  );
}
assert.equal(tierProbeJson.includes('club_pro'), false, 'No tier value may appear anywhere in the public payload');
assert.equal(tierProbe.club.show_attribution, false, 'The attribution boolean must survive sanitization (false must not be dropped)');
assert.equal(
  sanitizePublicReportPayload({ ...safeFixture, club: { name: 'Free Club' } }).club.show_attribution, true,
  'Attribution defaults to shown when the server sends no boolean',
);

// The API's server-side decision and the app's must not drift apart.
const featureGates = await readFile(path.join(root, 'src', 'lib', 'plans', 'featureGates.js'), 'utf8');
assert.match(featureGates, /export function showsReportAttribution/, 'showsReportAttribution must remain exported for the share endpoint');
assert.match(supabaseRoute, /showsReportAttribution\(club\.plan_key\)/, 'Share endpoint must derive attribution server-side');
assert.doesNotMatch(supabaseRoute, /club: club \? \{ name: club\.name, plan_key/, 'Share endpoint must never emit plan_key');

console.log('Public report safety check passed.');
console.log(`Safe findings: ${safeOutput.findings.length}; cleaned unsafe findings: ${cleanedUnsafeOutput.findings.length}.`);
