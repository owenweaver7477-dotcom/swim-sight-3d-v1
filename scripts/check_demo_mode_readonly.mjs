// Demo ("Example data") mode must never write to the database.
//
// This guard EXERCISES that promise instead of asserting it. It imports the real
// data layer and actually calls every mutating method, then checks how each fails.
//
// The proof is two-sided, and that is the point:
//
//   • __VITE_ENV__ is deliberately empty, so the lazy `supabase` proxy in
//     src/lib/supabaseClient.js throws the instant anything touches it.
//   • With demo mode ON  → the call must fail with DemoModeWriteError, meaning the
//     refusal fired BEFORE Supabase was ever reached.
//   • With demo mode OFF → the very same call must fail with the Supabase config
//     error, proving the call genuinely does reach Supabase when not refused.
//
// One-sided checks cannot tell "refused" apart from "never ran". This can.
//
// COVERAGE IS DERIVED, NOT LISTED. The set of methods under test comes from the
// adapter itself: anything that is not on the small READ_ONLY_METHODS allowlist is
// treated as a write and must be refused. A newly added write method is therefore
// caught by default rather than by somebody remembering to update a list — which is
// exactly how bulkCreate went unguarded into production. Unknown methods fail the
// guard loudly instead of being skipped: unhandled means broken, not fine.
//
// Run: node --import ./scripts/_src_loader.mjs scripts/check_demo_mode_readonly.mjs

import assert from 'node:assert/strict';

globalThis.__VITE_ENV__ = {}; // no VITE_SUPABASE_* — see above

// demoMode.js persists the flag in localStorage, which Node does not have.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

const { entities } = await import('../src/lib/data/entities.js');
const { enableDemoMode, exitDemoMode } = await import('../src/lib/demoMode.js');

// The ONLY methods allowed to not refuse in demo mode. Everything else on the
// adapter is assumed to be a write until someone consciously adds it here.
const READ_ONLY_METHODS = new Set(['list', 'filter', 'query', 'get']);

const PROBE_ID = '00000000-0000-0000-0000-000000000000';
const PROBE_ROW = { observation: 'guard probe' };

// How to invoke each write method. A write method missing from here fails the
// guard — see the "not covered" check below.
const WRITE_CALL_ARGS = {
  create: [PROBE_ROW],
  update: [PROBE_ID, PROBE_ROW],
  delete: [PROBE_ID],
  softDelete: [PROBE_ID],
  bulkCreate: [[PROBE_ROW]],
};

const ENTITIES = ['Finding', 'Report', 'KeyFrame', 'VideoAnnotation', 'Swimmer', 'Drill', 'CoachCueSnippet'];

function methodsOf(adapter) {
  return Object.keys(adapter).filter((key) => typeof adapter[key] === 'function');
}

async function failureOf(fn) {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

const problems = [];

// ── 0. Derive coverage from the adapter, and refuse to run half-blind ─────────
const reference = entities.Finding;
assert.ok(reference, 'entities.Finding must exist');

const allMethods = methodsOf(reference);
const writeMethods = allMethods.filter((name) => !READ_ONLY_METHODS.has(name));

for (const name of READ_ONLY_METHODS) {
  if (!allMethods.includes(name)) {
    problems.push(
      `READ_ONLY_METHODS lists "${name}" but the adapter has no such method. `
      + 'If it was renamed, the rename silently shrank this guard\'s coverage.'
    );
  }
}

const uncovered = writeMethods.filter((name) => !WRITE_CALL_ARGS[name]);
if (uncovered.length) {
  problems.push(
    `Adapter method(s) not covered by this guard: ${uncovered.join(', ')}. `
    + 'Add call arguments to WRITE_CALL_ARGS so the refusal is exercised, or add the '
    + 'name to READ_ONLY_METHODS if it genuinely does not write. Not deciding is not an option: '
    + 'an unexercised method is how bulkCreate reached production unguarded.'
  );
}

const testable = writeMethods.filter((name) => WRITE_CALL_ARGS[name]);

// ── 1. Demo mode ON: every write must be refused before Supabase is touched ────
enableDemoMode();

for (const entityName of ENTITIES) {
  const adapter = entities[entityName];
  assert.ok(adapter, `entities.${entityName} must exist`);

  for (const methodName of testable) {
    const error = await failureOf(() => adapter[methodName](...WRITE_CALL_ARGS[methodName]));

    if (!error) {
      problems.push(
        `${entityName}.${methodName}() RESOLVED in demo mode — a write was not refused. `
        + 'Every mutating adapter method must call refuseDemoWrite() before touching Supabase.'
      );
      continue;
    }

    if (!error.isDemoModeWrite) {
      problems.push(
        `${entityName}.${methodName}() failed in demo mode with "${error.message}" `
        + `(${error.name}) instead of DemoModeWriteError. `
        + (/VITE_SUPABASE/.test(error.message)
          ? 'That message means it REACHED Supabase — the demo refusal did not fire first.'
          : 'The demo refusal did not fire.')
      );
    }
  }

  // Readers must NOT be refused — otherwise demo mode would just be broken, and
  // part 1 would pass for the wrong reason.
  for (const methodName of READ_ONLY_METHODS) {
    if (typeof adapter[methodName] !== 'function') continue;
    const error = await failureOf(() => (
      methodName === 'get' ? adapter.get(PROBE_ID) : adapter[methodName]({})
    ));
    if (error?.isDemoModeWrite) {
      problems.push(`${entityName}.${methodName}() was refused as a write, but it is on the read-only allowlist.`);
    }
  }
}

// ── 2. Demo mode OFF: the same calls must actually reach Supabase ──────────────
// Without this half, a method that silently did nothing at all would pass part 1.
exitDemoMode();

for (const methodName of testable) {
  const error = await failureOf(() => entities.Finding[methodName](...WRITE_CALL_ARGS[methodName]));

  if (!error) {
    problems.push(
      `Finding.${methodName}() resolved with demo mode OFF and no Supabase env. `
      + 'It cannot have reached the database, so part 1 proves nothing for this method.'
    );
    continue;
  }

  if (error.isDemoModeWrite) {
    problems.push(
      `Finding.${methodName}() was refused as a demo write even though demo mode is OFF — `
      + 'the refusal is not actually gated on demo mode.'
    );
  } else if (!/VITE_SUPABASE/.test(error.message)) {
    problems.push(
      `Finding.${methodName}() with demo mode OFF failed with "${error.message}" — `
      + 'expected the Supabase config error, which is how we know the call reaches Supabase.'
    );
  }
}

if (problems.length) {
  console.error('\nDemo mode is not read-only:\n');
  problems.forEach((problem) => console.error(`  ✗ ${problem}\n`));
  process.exit(1);
}

console.log(
  `Demo mode read-only: ${testable.length} write methods derived from the adapter `
  + `(${testable.join(', ')}), ${ENTITIES.length * testable.length} calls refused with `
  + `DemoModeWriteError before reaching Supabase, all confirmed to reach Supabase when demo mode is off, `
  + `and ${READ_ONLY_METHODS.size} readers confirmed not refused.`
);
