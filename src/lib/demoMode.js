// Demo ("Example data") mode — front-end only.
//
// When active, reads for the demo club are served from the in-memory dataset in
// demoData.js instead of Supabase, and every write is refused. Nothing in this mode
// can touch the database, and because all demo records are scoped to DEMO_CLUB_ID
// they can never mix into a real club's roster, reports or analytics.

import { DEMO_CLUB, DEMO_CLUB_ID, DEMO_TABLES } from '@/lib/demoData';

const STORAGE_KEY = 'ssd.demoMode';
const listeners = new Set();

export { DEMO_CLUB, DEMO_CLUB_ID };

export function isDemoMode() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false; // private mode / storage disabled
  }
}

function notify() {
  listeners.forEach((fn) => { try { fn(isDemoMode()); } catch { /* listener errors must not break the toggle */ } });
}

export function enableDemoMode() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* best effort */ }
  notify();
}

export function exitDemoMode() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* best effort */ }
  notify();
}

/** Subscribe to demo-mode changes. Returns an unsubscribe function. */
export function onDemoModeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when a record/filter belongs to the demo club. */
export function isDemoScope(value) {
  if (!value) return false;
  if (typeof value === 'string') return value === DEMO_CLUB_ID;
  return value.club_id === DEMO_CLUB_ID || value.id === DEMO_CLUB_ID;
}

const matchesFilter = (row, filter = {}) =>
  Object.entries(filter).every(([key, expected]) => {
    if (expected === undefined) return true;
    if (Array.isArray(expected)) return expected.includes(row[key]);
    return row[key] === expected;
  });

/**
 * Rows for an entity in demo mode, applying the same simple equality filtering the
 * real data layer does. Returns a copy so callers can never mutate the dataset.
 */
export function getDemoRows(entityName, filter = {}, order, limit) {
  const table = DEMO_TABLES[entityName];
  if (!table) return [];
  let rows = table.filter((row) => matchesFilter(row, filter)).map((row) => ({ ...row }));

  if (order) {
    const desc = order.startsWith('-');
    const key = desc ? order.slice(1) : order;
    rows.sort((a, b) => {
      const av = a[key] ?? '';
      const bv = b[key] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (desc ? -1 : 1);
    });
  }
  return typeof limit === 'number' ? rows.slice(0, limit) : rows;
}

/**
 * Thrown when something attempts to persist while exploring example data. The demo
 * is strictly read-only — this is the guarantee that it cannot write to the database.
 */
export class DemoModeWriteError extends Error {
  constructor(action = 'save') {
    super(`You're exploring example data, so nothing is saved. Exit the demo squad to ${action} for real.`);
    this.name = 'DemoModeWriteError';
    this.isDemoModeWrite = true;
  }
}
