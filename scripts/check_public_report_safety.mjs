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

console.log('Public report safety check passed.');
console.log(`Safe findings: ${safeOutput.findings.length}; cleaned unsafe findings: ${cleanedUnsafeOutput.findings.length}.`);
