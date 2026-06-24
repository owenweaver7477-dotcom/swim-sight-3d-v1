import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'docs/PILOT_RUNBOOK.md',
  'src/pages/PilotLaunchPage.jsx',
  'src/components/pilot/PilotSessionNotes.jsx',
  'src/components/pilot/CoachPilotFeedbackForm.jsx',
  'src/components/pilot/PilotReportSafetySummary.jsx',
  'scripts/check_public_report_safety.mjs',
  'src/lib/sanitizeAIReport.js',
];
const unsafePilotExample = /signed_video_url|file_uri|pose_results|(?:raw_)?landmarks|height_cm|mass_kg|guardian_email|estimated_drag|calibration_config|callback_url/i;

async function exists(relativePath) {
  await access(path.join(root, relativePath));
  return true;
}

async function collectFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await collectFiles(absolute));
      else files.push(absolute);
    }
    return files;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

for (const file of requiredFiles) await exists(file);

const pilotExampleDirectories = [
  path.join(root, 'fixtures', 'pilot'),
  path.join(root, 'samples', 'pilot'),
];
const pilotExampleFiles = (await Promise.all(pilotExampleDirectories.map(collectFiles))).flat();
for (const file of pilotExampleFiles) {
  const content = await readFile(file, 'utf8');
  assert.equal(unsafePilotExample.test(content), false, `Unsafe field found in pilot example: ${path.relative(root, file)}`);
}

const appSource = await readFile(path.join(root, 'src', 'App.jsx'), 'utf8');
assert.match(appSource, /path="\/pilot-launch"/);
assert.match(appSource, /<ProtectedRoute/);
assert.match(appSource, /RoleProtectedRoute allowedRoles=\{COACH_APP_ROLES\}/);
assert.match(appSource, /RoleProtectedRoute allowedRoles=\{OWNER_ADMIN_ROLES\}/);

const roleGuardSource = await readFile(path.join(root, 'src', 'components', 'RoleProtectedRoute.jsx'), 'utf8');
assert.match(roleGuardSource, /allowedRoles\.includes\(role\)/);
assert.match(roleGuardSource, /Access restricted/);

const clubContextSource = await readFile(path.join(root, 'src', 'lib', 'useClubContext.js'), 'utf8');
assert.doesNotMatch(clubContextSource, /_memberRole \|\| 'coach'/);

const pageSource = await readFile(path.join(root, 'src', 'pages', 'PilotLaunchPage.jsx'), 'utf8');
assert.match(pageSource, /PILOT_ROLES/);
assert.match(pageSource, /owner/);
assert.match(pageSource, /admin/);
assert.match(pageSource, /coach/);
assert.match(pageSource, /functions\.getSwimmerConsent/);
assert.doesNotMatch(pageSource, /swimmer\.consent_status/);

console.log('Pilot launch readiness check passed.');
console.log(`Required files: ${requiredFiles.length}; pilot example files scanned: ${pilotExampleFiles.length}.`);
