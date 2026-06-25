import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(absolute));
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function lucideImports(source) {
  const imported = new Set();
  const importPattern = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  for (const match of source.matchAll(importPattern)) {
    const names = match[1]
      .split(',')
      .map((name) => name.trim().split(/\s+as\s+/i)[0]?.trim())
      .filter(Boolean);
    for (const name of names) imported.add(name);
  }
  return imported;
}

const app = await read('src/App.jsx');
assert.match(app, /path="\/analyse"/, '/analyse route is missing');
assert.match(app, /path="\/analysis"\s+element=\{<Navigate to="\/analyse" replace \/>}/, '/analysis must redirect to /analyse');

const analyse = await read('src/pages/Analyse.jsx');
assert.doesNotMatch(analyse, /<Activity\b/, 'Analyse.jsx must not render Activity');
assert.doesNotMatch(analyse, /\bActivity\b[\s,}]*from\s*['"]lucide-react['"]/, 'Analyse.jsx should not import Activity');
assert.match(analyse, /class AnalysePanelBoundary/, 'Analyse.jsx must isolate risky child panels');
assert.match(analyse, /function SafeAnalyseSection/, 'Analyse.jsx must expose fail-soft section wrappers');
assert.match(analyse, /swimmersQuery\.isError/, 'Analyse must fail soft when swimmer setup data fails');
assert.match(analyse, /squadsQuery\.isError/, 'Analyse must fail soft when squad setup data fails');
assert.match(analyse, /The app could not load the swimmer setup data/, 'Analyse data failure copy is missing');
for (const section of [
  'Analysis focus checklist',
  'Video library',
  'AI report output selector',
  'Review setup',
  'AI credit indicator',
]) {
  assert.ok(analyse.includes(section), `Analyse fail-soft wrapper missing: ${section}`);
}
assert.match(analyse, /Add a New Swimmer/, 'Analyse must guide empty swimmer state');

const videoLibrary = await read('src/components/analysis/VideoLibrary.jsx');
assert.doesNotMatch(videoLibrary, /<Activity\b/, 'VideoLibrary must not render Activity');
assert.match(videoLibrary, /No videos uploaded yet/, 'VideoLibrary must keep empty upload state');
assert.match(videoLibrary, /Continue Manual Review/, 'VideoLibrary must keep manual review fallback');

const routeBoundary = await read('src/components/system/RouteErrorBoundary.jsx');
assert.match(routeBoundary, /Analyse setup is temporarily unavailable/, 'Analyse route fallback copy is missing');
assert.match(routeBoundary, /currentUserRole/, 'Route error boundary must log safe role context');
assert.match(routeBoundary, /componentStack/, 'Route error boundary must log component stack');
assert.match(routeBoundary, /Manual coach review/, 'Analyse route fallback must offer manual review');

const sourceFiles = await collectSourceFiles(path.join(root, 'src'));
const activityIssues = [];
for (const absolute of sourceFiles) {
  const source = await readFile(absolute, 'utf8');
  if (!/<Activity\b/.test(source)) continue;
  if (!lucideImports(source).has('Activity')) {
    activityIssues.push(path.relative(root, absolute));
  }
}
assert.deepEqual(activityIssues, [], `Activity is rendered without a lucide import in: ${activityIssues.join(', ')}`);

for (const optionalFile of [
  'src/components/analysis/AnalysisSetup.jsx',
  'src/components/analysis/AIReportOutputSelector.jsx',
  'src/components/analysis/AnalysisFocusChecklist.jsx',
  'src/components/analysis/ReviewSetupPanel.jsx',
  'src/components/credits/AICreditIndicator.jsx',
]) {
  if (!existsSync(path.join(root, optionalFile))) continue;
  const source = await read(optionalFile);
  assert.doesNotMatch(source, /signed_video_url|file_uri|raw_landmarks|pose_results|guardian_email/i, `${optionalFile} should not render private report fields`);
}

console.log('Analyse route runtime safety check passed.');
console.log(`Source files scanned for Activity imports: ${sourceFiles.length}.`);
