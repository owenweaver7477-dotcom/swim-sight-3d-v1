import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function collectTextFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await collectTextFiles(absolute));
      else if (/\.(?:jsx?|tsx?|jsonc?|sql|md)$/.test(entry.name)) files.push(absolute);
    }
    return files;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const appSource = await read('src/App.jsx');
const sidebarSource = await read('src/components/layout/Sidebar.jsx');
const protectedRouteSource = await read('src/components/ProtectedRoute.jsx');
const infrastructureSource = await read('src/pages/AIInfrastructureStatus.jsx');
const diagnosticsGateSource = await read('src/lib/useDiagnosticsVisible.js');
const homepageSource = await read('src/pages/public/HomePage.jsx');
const publicNavSource = await read('src/components/public/PublicNav.jsx');
const publicFooterSource = await read('src/components/public/PublicFooter.jsx');

assert.match(appSource, /<ProtectedRoute unauthenticatedElement=\{<Navigate to="\/login" replace \/>\}/);
assert.match(protectedRouteSource, /isLoadingAuth \|\| !authChecked/);
assert.match(protectedRouteSource, /if \(!isAuthenticated\)/);

const coachGuardIndex = appSource.indexOf('RoleProtectedRoute allowedRoles={COACH_APP_ROLES}');
const ownerGuardIndex = appSource.indexOf('RoleProtectedRoute allowedRoles={OWNER_ADMIN_ROLES}');
const ownerGuardEndIndex = appSource.indexOf('path="/sign-in"');
assert.ok(coachGuardIndex > 0, 'Coach route guard is missing');
assert.ok(ownerGuardIndex > coachGuardIndex, 'Owner/admin route guard is missing');
assert.ok(ownerGuardEndIndex > ownerGuardIndex, 'Owner/admin route group has no closing boundary');

const coachRoutes = [
  '/dashboard', '/analyse', '/ai-reviews', '/ai-review', '/swimmers', '/reference-library',
  '/club-progress', '/swimmer-trends', '/performance', '/club-settings',
  '/drill-library', '/pilot-launch',
];
for (const route of coachRoutes) {
  const routeIndex = appSource.indexOf(`path="${route}"`);
  assert.ok(routeIndex > coachGuardIndex && routeIndex < ownerGuardIndex, `${route} must stay inside the coach role guard`);
}

const ownerRoutes = [
  '/ai-jobs', '/ai-calibration', '/ai-infrastructure-status',
  '/footage-checklist', '/coach-testing', '/roadmap',
];
for (const route of ownerRoutes) {
  const routeIndex = appSource.indexOf(`path="${route}"`);
  assert.ok(routeIndex > ownerGuardIndex && routeIndex < ownerGuardEndIndex, `${route} must stay inside the owner/admin role guard`);
}

// Internal/platform tools stay behind an app-level admin check in the sidebar.
// Pin the property (role === 'admin'), not just the render guard, so a rename
// can't quietly widen this to club owners/coaches.
assert.match(sidebarSource, /const isPlatformAdmin = user\?\.role === 'admin'/);
assert.match(sidebarSource, /\{isPlatformAdmin && \(/);
for (const route of ownerRoutes.filter(route => route !== '/coach-testing')) {
  if (!sidebarSource.includes(`to: '${route}'`)) continue;
  assert.ok(sidebarSource.indexOf(`to: '${route}'`) < sidebarSource.indexOf('export default function Sidebar'));
}

assert.match(infrastructureSource, /useDiagnosticsVisible/);
assert.match(diagnosticsGateSource, /import\.meta\.env\.DEV === true/);
assert.match(diagnosticsGateSource, /DIAGNOSTIC_ROLES\.has\(memberRole\)/);
assert.match(diagnosticsGateSource, /appRole === 'admin'/);

// Coach-led positioning: the homepage leads with the coach workflow and states
// plainly that the coach creates and approves everything a swimmer ever sees.
// These pins were rewritten for the 2026-07-11 repositioning; the previous
// AI-forward wording was removed from the product on purpose and must not return.
assert.match(homepageSource, /Turn one video into a clear coaching plan\./);
assert.match(homepageSource, /Video in, coach review, approved findings, swimmer report out\./);
assert.match(homepageSource, /Every finding is coach-created and coach-approved\./);
assert.match(homepageSource, /Reports only ever show the content you approved\./);

const publicChrome = `${publicNavSource}\n${publicFooterSource}`;
for (const privateRoute of [...coachRoutes, ...ownerRoutes]) {
  assert.equal(publicChrome.includes(`to="${privateRoute}"`), false, `${privateRoute} leaked into public navigation`);
}

const uiFiles = [
  ...await collectTextFiles(path.join(root, 'src', 'pages')),
  ...await collectTextFiles(path.join(root, 'src', 'components')),
];
const diagnosticPatterns = [
  /Backend:\s*Supabase/i,
  /Supabase Connected/i,
  /Project URL/i,
  /Anon Key/i,
  /Key Format/i,
  /Active Role/i,
  /Coach Mode Finding/i,
  /Vercel production env/i,
  /Connection test runs/i,
  /Checking Supabase/i,
  /VITE_SUPABASE_ANON_KEY/i,
];
const dummyClubPattern = /Jindalee Dolphins|Harbour Swim Club|Redlands Rays/i;

for (const file of uiFiles) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(root, file);
  for (const pattern of diagnosticPatterns) {
    assert.equal(pattern.test(source), false, `Production diagnostic text found in ${relative}: ${pattern}`);
  }
  assert.equal(dummyClubPattern.test(source), false, `Dummy club name found in ${relative}`);
}

const dataRoots = ['api', 'base44', 'supabase', 'fixtures', 'public'];
for (const dataRoot of dataRoots) {
  const files = await collectTextFiles(path.join(root, dataRoot));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.equal(dummyClubPattern.test(source), false, `Dummy club name found in ${path.relative(root, file)}`);
  }
}

console.log('Production surface check passed.');
console.log(`Coach routes checked: ${coachRoutes.length}; owner/admin routes checked: ${ownerRoutes.length}; UI files scanned: ${uiFiles.length}.`);
