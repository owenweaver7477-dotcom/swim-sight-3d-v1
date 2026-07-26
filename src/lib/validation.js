// Shared input validation.
//
// Context: a design audit found a swimmer in production literally named "o". A
// single-letter roster entry makes the whole product read as seed data rather than
// a tool in use, so person names are validated at entry.

const MIN_NAME_LENGTH = 2;

/**
 * A person's name is acceptable when, after trimming, it is at least two characters
 * and contains at least one letter (so "-", "1", ".." are rejected).
 * Deliberately permissive about scripts, accents, apostrophes and hyphens so real
 * names like "Ng", "O'Brien", "Åsa" or non-Latin names are never blocked.
 */
export function isValidPersonName(value) {
  const name = String(value ?? '').trim();
  if (name.length < MIN_NAME_LENGTH) return false;
  return /\p{L}/u.test(name);
}

/** Human-readable reason a name was rejected, or '' when it is valid/empty. */
export function personNameError(value) {
  const name = String(value ?? '').trim();
  if (!name) return '';           // empty is "incomplete", not "invalid" — the button stays disabled
  if (isValidPersonName(name)) return '';
  if (name.length < MIN_NAME_LENGTH) return 'Enter the swimmer’s full name (at least 2 characters).';
  return 'Enter a name that includes at least one letter.';
}
