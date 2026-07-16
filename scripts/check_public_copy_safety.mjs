// Public marketing copy must never drift into the certainty/medical language
// CLAUDE.md section 5 forbids. check_public_report_safety.mjs already guards what
// a *shared report* can contain; nothing guarded the marketing surface a coach or
// parent reads before they ever sign up. This is that net.
//
// Scope: the public pages + public chrome only. The logged-in app has its own
// guards (phase3-coach-polish, safeguarding) and legitimately says things like
// "AI-suggested finding" that would be wrong on a billboard.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function collect(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collect(full));
    else if (/\.jsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Section 5: language implying certainty, diagnosis, or medical/biomechanical
// authority. Word-bounded so ordinary copy ("performance", "startle") is safe.
const FORBIDDEN = [
  [/\bguarantee(d|s)?\b/i, 'guarantees an outcome'],
  [/\bdiagnos(is|es|e|ed|ing|tic)\b/i, 'claims diagnosis'],
  [/\bproven\b/i, 'claims proof'],
  [/\bperfect(ly|ed)?\b/i, 'claims perfection'],
  [/\bdefinitive\b/i, 'claims a definitive conclusion'],
  [/\b(medical|clinical|injury)\s+(cause|advice|assessment|conclusion)\b/i, 'makes a medical/injury claim'],
  [/\b(cure|treat|heal)s?\s+(injur|pain)/i, 'makes a treatment claim'],
  [/\b100%\s*(accurate|correct|reliable)\b/i, 'claims total accuracy'],
  [/\bnever\s+wrong\b/i, 'claims infallibility'],
];

const files = [
  ...await collect(path.join(root, 'src', 'pages', 'public')),
  ...await collect(path.join(root, 'src', 'components', 'public')),
];
assert.ok(files.length > 0, 'no public copy found to check — did the paths move?');

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(root, file);
  for (const [pattern, why] of FORBIDDEN) {
    const hit = source.match(pattern);
    assert.equal(
      hit,
      null,
      `Unsafe public copy in ${relative}: ${why} (matched "${hit?.[0]}"). See CLAUDE.md section 5; soften to suggestion language (section 4).`,
    );
  }
}

// The coach-led positioning is the brand: the public surface must keep saying the
// coach creates and approves what a swimmer sees.
const homepage = await readFile(path.join(root, 'src', 'pages', 'public', 'HomePage.jsx'), 'utf8');
assert.match(homepage, /coach-created and coach-approved/i, 'homepage must keep the coach-control claim');

console.log(`Public copy safety check passed (${files.length} files, ${FORBIDDEN.length} patterns).`);
