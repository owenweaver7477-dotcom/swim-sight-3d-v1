// A stand-in for @supabase/supabase-js that CAPTURES what the data layer would send
// instead of talking to a database. It exists so guards can assert on the exact row
// the app would write — the real mappers and defaults run, only the network is absent.
//
// Activated by the loader (scripts/_src_loader_hooks.mjs) when SS_SUPABASE_STUB=1, so
// nothing outside a guard run is ever affected.
//
// Nothing here writes anywhere. There is no network client in this file at all.

export const captured = [];

function resultFor(row) {
  // Echo the payload back the way PostgREST would, so `.select('*').single()` resolves.
  return { data: Array.isArray(row) ? row : { id: 'stub-id', ...row }, error: null };
}

function builder(table, op, payload) {
  const record = { table, op, payload };
  captured.push(record);

  const chain = {
    select: () => chain,
    single: async () => resultFor(payload),
    eq: (column, value) => {
      record.filters = { ...(record.filters || {}), [column]: value };
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    // Awaiting the builder directly (list/filter do this) resolves to rows.
    then: (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  };
  return chain;
}

export function createClient() {
  return {
    from(table) {
      return {
        insert: (payload) => builder(table, 'insert', payload),
        update: (payload) => builder(table, 'update', payload),
        delete: () => builder(table, 'delete', null),
        select: () => builder(table, 'select', null),
      };
    },
    auth: {},
    storage: { from: () => ({}) },
  };
}

export function resetCaptured() {
  captured.length = 0;
}

export function lastCaptured() {
  return captured[captured.length - 1] || null;
}
