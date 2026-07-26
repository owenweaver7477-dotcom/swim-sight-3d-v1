// The coach-approval moat: AI output must never reach a report without a coach
// approving it. "Coach-created and coach-approved" is the product's entire positioning,
// and it is enforced ONLY by application code — RLS `findings_manage_coaches` lets any
// coach-role member write any column, including approval_status.
//
// Four invariants, each pinned as tightly as it can honestly be pinned:
//
//   1. EXERCISED — the data layer never invents or upgrades approval_status. A create
//      that does not set it must not acquire it (so the DB default 'pending' applies).
//   2. EXERCISED — a coach-authored create carries source 'coach' through the real
//      mappers; nothing in the data layer can turn it into an AI-sourced finding.
//   3. FAIL-CLOSED SCAN — every Finding.create call site in src/ must be classified.
//      A NEW finding-creation surface fails this guard until someone declares what it
//      is. The composer is exactly such a surface, which is why this exists.
//   4. BEHAVIOUR SCAN — AI findings are inserted 'pending'; the detail-edit path never
//      touches approval_status; only the explicit approve/reject actions set it.
//
// Invariants 3 and 4 are source scans, and that is stated in the output rather than
// dressed up as execution — a scan that claims to be a proof is worse than one that
// admits what it is.
//
// Run: SS_SUPABASE_STUB=1 node --import ./scripts/_src_loader.mjs scripts/check_coach_approval_moat.mjs

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

// ── EXERCISED HALF ────────────────────────────────────────────────────────────
globalThis.__VITE_ENV__ = { VITE_SUPABASE_URL: 'https://stub.local', VITE_SUPABASE_ANON_KEY: 'stub' };
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { entities } = await import('../src/lib/data/entities.js');
const { lastCaptured, resetCaptured } = await import(
  path.join(ROOT, 'scripts', '_supabase_stub.mjs')
);

// 1. A create that omits approval_status must reach the database without one, so the
//    column default ('pending') decides. If a mapper ever defaulted it, AI findings
//    could be born approved without any call site changing.
resetCaptured();
await entities.Finding.create({ report_id: 'r1', observation: 'moat probe' });
const bare = lastCaptured()?.payload || {};
if ('approval_status' in bare) {
  problems.push(
    `The data layer added approval_status=${JSON.stringify(bare.approval_status)} to a create `
    + 'that did not ask for it. The DB default must be what decides, or an AI finding could '
    + 'be born approved without any call site changing.'
  );
}
if ('source' in bare) {
  problems.push(
    `The data layer added source=${JSON.stringify(bare.source)} to a create that did not ask for it.`
  );
}

// 2. A coach-authored create must arrive as source 'coach' — the mappers must not
//    rewrite it, and the full content model must survive alongside it.
resetCaptured();
await entities.Finding.create({
  report_id: 'r1', source: 'coach', approval_status: 'approved',
  title: 'moat probe heading', observation: 'moat probe',
  why_it_matters: 'w', correction_cue: 'c', next_focus: 'n',
});
const coachRow = lastCaptured()?.payload || {};
if (coachRow.source !== 'coach') {
  problems.push(`A coach-authored create reached the database with source=${JSON.stringify(coachRow.source)}, expected 'coach'.`);
}
for (const field of ['title', 'observation', 'why_it_matters', 'correction_cue', 'next_focus']) {
  if (!coachRow[field]) {
    problems.push(`A coach-authored create lost "${field}" before reaching the database.`);
  }
}

// ── FAIL-CLOSED SCAN: every finding-creation surface must be classified ───────
const CREATE_SITES = {
  // file -> why this surface is allowed to create findings
  'src/pages/AIReportPage.jsx': 'Coach Studio / composer — coach-authored, approved by authorship',
  'src/pages/Analyse.jsx': 'Manual finding form — coach-authored, approved by authorship',
};

async function read(rel) {
  return readFile(path.join(ROOT, rel), 'utf8');
}

async function listSourceFiles(dir) {
  const { readdir } = await import('node:fs/promises');
  const out = [];
  for (const entry of await readdir(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await listSourceFiles(rel));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const sourceFiles = await listSourceFiles('src');
const foundCreateSites = [];
for (const rel of sourceFiles) {
  const text = await read(rel);
  if (/entities\.Finding\.create\s*\(/.test(text)) foundCreateSites.push(rel);
}

for (const rel of foundCreateSites) {
  if (!CREATE_SITES[rel]) {
    problems.push(
      `UNCLASSIFIED finding-creation surface: ${rel}. Every place that creates a finding must be `
      + 'declared in CREATE_SITES with what it is, and must set source and approval_status '
      + 'deliberately. A new authoring surface is exactly where "coach-authored, never '
      + 'AI-approved" regresses — unhandled is treated as broken, not fine.'
    );
  }
}
for (const rel of Object.keys(CREATE_SITES)) {
  if (!foundCreateSites.includes(rel)) {
    problems.push(`CREATE_SITES lists ${rel}, but it no longer creates findings. If it moved, this guard is now watching the wrong file.`);
  }
}

// Each classified coach surface must set source 'coach' explicitly and must never
// mint an AI-sourced finding.
for (const rel of foundCreateSites) {
  if (!CREATE_SITES[rel]) continue;
  const text = await read(rel);
  if (!/source:\s*'coach'/.test(text)) {
    problems.push(`${rel} creates findings but never sets source: 'coach' — it must be explicit, not inherited from a column default.`);
  }
  if (/source:\s*'ai'/.test(text)) {
    problems.push(`${rel} mints an AI-sourced finding from a client authoring surface. AI findings may only be created by the worker callback.`);
  }
}

// ── BEHAVIOUR SCAN: the AI path and the edit path ─────────────────────────────
const callback = await read('api/_lib/ai/callbackHandler.js');
if (!/source:\s*'ai',\s*\n\s*approval_status:\s*'pending'/.test(callback)) {
  problems.push(
    'api/_lib/ai/callbackHandler.js no longer inserts AI findings as '
    + "source 'ai' + approval_status 'pending' on adjacent lines. This is THE moat: AI output "
    + 'must land pending and reach a report only through the coach approve action.'
  );
}
if (/source:\s*'ai',[\s\S]{0,200}approval_status:\s*'approved'/.test(callback)) {
  problems.push('api/_lib/ai/callbackHandler.js appears to create an AI finding as approved.');
}

const reportPage = await read('src/pages/AIReportPage.jsx');
const updateDetails = reportPage.slice(
  reportPage.indexOf('const updateFindingDetails'),
  reportPage.indexOf('const createAnnotation'),
);
if (!updateDetails) {
  problems.push('Could not locate updateFindingDetails in AIReportPage.jsx — this guard is watching the wrong shape.');
} else if (/approval_status/.test(updateDetails)) {
  problems.push(
    'updateFindingDetails now touches approval_status. Editing a finding\'s content must never '
    + 'change its approval state — that is how an edit could silently approve AI output.'
  );
}

if (problems.length) {
  console.error('\nCoach-approval moat is not intact:\n');
  problems.forEach((p) => console.error(`  ✗ ${p}\n`));
  process.exit(1);
}

console.log(
  'Coach-approval moat intact: '
  + `2 invariants EXERCISED against the real data layer (approval_status/source never invented; `
  + `coach create keeps source 'coach' and all 5 content fields), `
  + `${foundCreateSites.length} finding-creation surfaces classified and checked, `
  + 'AI insert pinned to pending, edit path confirmed not to touch approval_status. '
  + '(The last three are source scans, not execution.)'
);
