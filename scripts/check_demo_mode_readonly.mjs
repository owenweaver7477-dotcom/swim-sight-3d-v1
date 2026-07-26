// Demo ("Example data") mode must never write to the database.
//
// This guard EXERCISES that promise instead of asserting it. It imports the real
// data layer and actually calls every write method, then checks how each one fails.
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

// Every mutating method on the adapter, with a minimal call for each.
const WRITE_METHODS = [
  ['create', (adapter) => adapter.create({ observation: 'guard probe' })],
  ['update', (adapter) => adapter.update('00000000-0000-0000-0000-000000000000', { observation: 'guard probe' })],
  ['delete', (adapter) => adapter.delete('00000000-0000-0000-0000-000000000000')],
  ['softDelete', (adapter) => adapter.softDelete('00000000-0000-0000-0000-000000000000')],
  ['bulkCreate', (adapter) => adapter.bulkCreate([{ observation: 'guard probe' }])],
];

// The entities a coach can write to from the review room / composer, plus the
// club-scoped records the demo squad is built from.
const ENTITIES = ['Finding', 'Report', 'KeyFrame', 'VideoAnnotation', 'Swimmer', 'Drill'];

async function failureOf(fn) {
  try {
    await fn();
    return null; // resolved — nothing threw
  } catch (error) {
    return error;
  }
}

const problems = [];

// ── 1. Demo mode ON: every write must be refused before Supabase is touched ────
enableDemoMode();

for (const entityName of ENTITIES) {
  const adapter = entities[entityName];
  assert.ok(adapter, `entities.${entityName} must exist`);

  for (const [methodName, call] of WRITE_METHODS) {
    const error = await failureOf(() => call(adapter));

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
}

// ── 2. Demo mode OFF: the same calls must actually reach Supabase ──────────────
// Without this half, a method that silently did nothing at all would pass part 1.
exitDemoMode();

for (const [methodName, call] of WRITE_METHODS) {
  const error = await failureOf(() => call(entities.Finding));

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

const checked = ENTITIES.length * WRITE_METHODS.length;
console.log(
  `Demo mode read-only: ${checked} write calls refused with DemoModeWriteError before reaching Supabase, `
  + `and all ${WRITE_METHODS.length} methods confirmed to reach Supabase when demo mode is off.`
);
