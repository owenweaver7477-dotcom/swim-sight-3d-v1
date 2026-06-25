import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function exists(relativePath) {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectApiFunctions(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_lib') continue;
      files.push(...await collectApiFunctions(absolute));
    } else if (/\.(?:js|ts)$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

const mockupPath = 'src/components/showcase/PremiumSwimSightMockup.jsx';
assert.equal(await exists(mockupPath), true, 'PremiumSwimSightMockup component must exist');

const mockupSource = await read(mockupPath);
const homepageSource = await read('src/pages/public/HomePage.jsx');
const dashboardSource = await read('src/pages/TeamDashboard.jsx');
const sidebarSource = await read('src/components/layout/Sidebar.jsx');

assert.match(homepageSource, /<PremiumSwimSightMockup[^>]*interactive=\{false\}/, 'Homepage should use the showcase as a non-interactive marketing preview');
assert.doesNotMatch(dashboardSource, /PremiumSwimSightMockup/, 'Authenticated dashboard must not render the marketing mockup');
assert.match(mockupSource, /interactive = false/, 'Showcase should default to non-interactive');
assert.match(mockupSource, /Product preview/, 'Showcase should label itself as a preview when decorative');
assert.match(mockupSource, /pointer-events-none/, 'Decorative mockup controls should not behave like live app buttons');

assert.match(sidebarSource, /to: '\/analyse'.*label: 'Analyse Video'|label: 'Analyse Video'.*to: '\/analyse'/s, 'Sidebar Analyse Video must route to /analyse');
assert.match(sidebarSource, /to: '\/dashboard'/, 'Sidebar dashboard route must remain present');
assert.match(sidebarSource, /to: '\/ai-reviews'/, 'Sidebar Coach Studio route must remain present');

assert.equal(await exists('api/ai/[action].js'), true, 'Consolidated AI action route must remain present');
for (const staleRoute of ['api/ai/trigger.js', 'api/ai/callback.js', 'api/ai/cancel.js']) {
  assert.equal(await exists(staleRoute), false, `${staleRoute} must not be reintroduced`);
}

const apiFunctions = await collectApiFunctions(path.join(root, 'api'));
assert.ok(apiFunctions.length <= 12, `Vercel function count must stay <= 12, found ${apiFunctions.length}`);

const unsafeClaims = /perfect AI|guaranteed improvement|true 3D measurement|AI replaces coach|measured drag force/i;
for (const [label, source] of [
  ['homepage', homepageSource],
  ['showcase', mockupSource],
  ['dashboard', dashboardSource],
]) {
  assert.equal(unsafeClaims.test(source), false, `Unsafe public/product claim found in ${label}`);
}

console.log('Premium showcase integration check passed.');
console.log(`API function count: ${apiFunctions.length}`);
