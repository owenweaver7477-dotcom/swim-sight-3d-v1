// Reusable phrases for the finding composer.
//
// Two sources, merged: phrases bundled with the app (below) and phrases a club has saved
// (public.coach_cue_snippets, migration 028). The bundled set is what makes the composer
// useful on day one, before any club has written anything — the cold-start problem the
// design audit flagged, applied to authoring rather than to data.
//
// The DB half is strictly optional. If the table is absent or unreadable the composer
// still works from the bundled set and simply hides "save phrase", so the feature is
// never coupled to the migration having run.

export const PHRASE_FIELDS = ['title', 'observation', 'why_it_matters', 'cue', 'next_focus'];

// Written the way a coach talks, not the way a spec reads. Kept deliberately short so
// they act as a starting line the coach edits, rather than words put in their mouth.
const BUNDLED = {
  observation: [
    'Heels drift outside the knee line on recovery',
    'Elbow drops at the front of the catch',
    'Head lifts before the breath',
    'Hips sit low through the stroke',
    'Kick stops during the breath',
    'Hand crosses the centre line on entry',
    'Push-off is shallow off the wall',
    'Stroke rate climbs over the last 15m',
  ],
  why_it_matters: [
    'Adds frontal drag and slows the back half',
    'Loses hold of the water at the strongest part of the stroke',
    'Breaks the body line, so the legs sink',
    'Costs distance per stroke',
    'Makes the breath a pause instead of part of the rhythm',
    'Turns a strength into wasted effort',
  ],
  cue: [
    'Squeeze the heels together',
    'Lead with the elbow, not the hand',
    'Look at the bottom of the pool',
    'Press the chest, lift the hips',
    'Keep the kick going through the breath',
    'Enter in front of your shoulder',
    'Hold the streamline two more counts',
  ],
  next_focus: [
    'Narrow kick on 25s',
    'Catch position on the next set',
    'Breathing rhythm every 3',
    'Streamline off every wall',
    'Hold stroke count over the last 50',
  ],
  title: [],
};

/** Bundled phrases for a field, newest-club-first ordering applied by the caller. */
export function bundledPhrases(field) {
  return BUNDLED[field] || [];
}

/**
 * Merge saved club phrases with the bundled set for one field.
 * Club phrases come first — a coach's own words should outrank ours — and exact
 * duplicates are collapsed so saving a bundled phrase does not show it twice.
 */
export function mergePhrases(field, savedRows = []) {
  const saved = savedRows
    .filter((row) => row && row.field === field && row.is_active !== false)
    .map((row) => ({ body: row.body, id: row.id, saved: true }))
    .filter((p) => p.body);

  const seen = new Set(saved.map((p) => p.body.trim().toLowerCase()));
  const bundled = bundledPhrases(field)
    .filter((body) => !seen.has(body.trim().toLowerCase()))
    .map((body) => ({ body, id: null, saved: false }));

  return [...saved, ...bundled];
}

/**
 * Insert a phrase into an existing value. Appends to a non-empty field rather than
 * replacing it, so clicking a phrase can never silently destroy what the coach typed —
 * the same principle as the autosave refusal not overwriting on-screen text.
 */
export function applyPhrase(current, phrase) {
  const existing = String(current || '').trim();
  if (!existing) return phrase;
  if (existing.toLowerCase().includes(phrase.trim().toLowerCase())) return existing;
  return /[.!?]$/.test(existing) ? `${existing} ${phrase}` : `${existing}. ${phrase}`;
}
