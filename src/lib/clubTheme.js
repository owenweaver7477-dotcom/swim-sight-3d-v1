// Club style option — drives the workspace accent from the club's chosen colours
// at runtime, so a club can theme its own workspace and every member sees it.
//
// Design constraints:
//  - Only the ACCENT-family tokens are overridden (--primary/--accent/--ring +
//    the sidebar variants). Surface tokens (--background/--card/--foreground)
//    are left alone so the light/dark theme still fully controls surfaces — a
//    club colour recolours the accent in BOTH light and dark, it never breaks
//    dark mode.
//  - Contrast-safe: the on-colour foreground flips to dark ink when the club
//    picks a light colour (e.g. gold/yellow), so button text stays readable.
//  - Default colours apply nothing (identical to the base brand), and switching
//    clubs / logging out clears the overrides so one club never bleeds into
//    another.

const DEFAULT_PRIMARY = '#0077b6';
const DEFAULT_ACCENT = '#00a6c8';

const THEMED_VARS = [
  '--primary', '--primary-foreground',
  '--accent', '--accent-foreground',
  '--ring',
  '--sidebar-primary', '--sidebar-primary-foreground', '--sidebar-ring',
];

// Dark ink (deep navy) used as the readable foreground on light club colours.
const DARK_INK = '222 47% 11%';
const WHITE_INK = '0 0% 100%';

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().toLowerCase();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return /^#[0-9a-f]{6}$/.test(h) ? h : null;
}

function toRgb(hex) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

// Space-separated HSL triplet ("201 100% 36%") to match the CSS custom-property format.
export function hexToHslTriplet(hex) {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  let { r, g, b } = toRgb(norm);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Inverse of hexToHslTriplet — needed by the contrast guard, which adjusts a
// colour's lightness while preserving its hue/saturation.
function hslTripletToHex(triplet) {
  const [hRaw, sRaw, lRaw] = String(triplet).split(' ');
  const h = (Number(hRaw) % 360) / 360;
  const s = Number(String(sRaw).replace('%', '')) / 100;
  const l = Number(String(lRaw).replace('%', '')) / 100;
  if ([h, s, l].some(Number.isNaN)) return null;

  const hue = (p, q, t0) => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r; let g; let b;
  if (s === 0) {
    r = l; g = l; b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Relative luminance 0..1 (sRGB) for WCAG contrast.
function luminance(hex) {
  const { r, g, b } = toRgb(hex);
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// Pick the on-colour ink (white vs deep-navy) that has the higher WCAG contrast
// against the club colour — a raw luminance threshold mis-handles mid-tones
// like amber, where dark ink is far more readable than white.
const DARK_INK_LUM = 0.017; // luminance of the deep-navy DARK_INK
function bestInk(hex) {
  const L = luminance(hex);
  const contrastWhite = (1.0 + 0.05) / (L + 0.05);
  const contrastDark = (L + 0.05) / (DARK_INK_LUM + 0.05);
  return contrastWhite >= contrastDark ? WHITE_INK : DARK_INK;
}

// ── Contrast guard ───────────────────────────────────────────────────────────
// A club colour is used BOTH as a fill (white text on it) and as text/icons on the
// page surface (`text-primary`). The second role is the dangerous one: a design
// audit flagged that vivid presets (Lime, Amber, Coral) as text on white fall well
// below the WCAG AA 4.5:1 minimum, "baking a contrast failure into a user setting".
// Rather than delete those presets, we honour the club's colour but nudge its
// lightness until it is legible on the current surface. The hue/saturation — the
// part that reads as "our club colour" — is preserved.
const AA_TEXT = 4.5;

function contrastVsLuminance(hex, otherLum) {
  const L = luminance(hex);
  const [hi, lo] = L > otherLum ? [L, otherLum] : [otherLum, L];
  return (hi + 0.05) / (lo + 0.05);
}

function withLightness(hex, lightnessPct) {
  const triplet = hexToHslTriplet(hex);
  if (!triplet) return hex;
  const [h, s] = triplet.split(' ');
  return hslTripletToHex(`${h} ${s} ${Math.max(0, Math.min(100, Math.round(lightnessPct)))}%`);
}

/**
 * Return a variant of `hex` that meets AA text contrast against the given surface.
 * Darkens on light surfaces, lightens on dark ones. Returns the original when it
 * already passes, so most clubs see no change at all.
 */
export function ensureTextContrast(hex, surfaceIsDark = false, target = AA_TEXT) {
  const norm = normalizeHex(hex);
  if (!norm) return hex;
  // Surface luminance: the app's light card (#ffffff) or dark card (#131e29).
  const surfaceLum = surfaceIsDark ? luminance('#131e29') : 1.0;
  if (contrastVsLuminance(norm, surfaceLum) >= target) return norm;

  const triplet = hexToHslTriplet(norm);
  if (!triplet) return norm;
  let l = Number(triplet.split(' ')[2].replace('%', ''));
  const step = surfaceIsDark ? 2 : -2; // lighten on dark, darken on light
  for (let i = 0; i < 50; i += 1) {
    l += step;
    if (l <= 0 || l >= 100) break;
    const candidate = withLightness(norm, l);
    if (contrastVsLuminance(candidate, surfaceLum) >= target) return candidate;
  }
  // Fell through: use the highest-contrast endpoint rather than an illegible colour.
  return surfaceIsDark ? '#ffffff' : '#0b1b2b';
}

/** True when the chosen colour had to be adjusted to stay legible (for UI hints). */
export function isContrastAdjusted(hex, surfaceIsDark = false) {
  const norm = normalizeHex(hex);
  if (!norm) return false;
  return ensureTextContrast(norm, surfaceIsDark) !== norm;
}

export function clearClubTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  THEMED_VARS.forEach((v) => root.style.removeProperty(v));
}

export function applyClubTheme(primaryHex, accentHex) {
  if (typeof document === 'undefined') return;
  const primary = normalizeHex(primaryHex) || DEFAULT_PRIMARY;
  const accent = normalizeHex(accentHex) || DEFAULT_ACCENT;

  // A club on the default palette should look exactly like the base brand.
  if (primary === DEFAULT_PRIMARY && accent === DEFAULT_ACCENT) {
    clearClubTheme();
    return;
  }

  const root = document.documentElement;
  // --primary / --accent are used as TEXT and icons (`text-primary`) as well as
  // fills, so they must clear AA against the current surface. Anything that only
  // ever sits behind white ink (rings, sidebar accents) keeps the vivid original.
  const surfaceIsDark = root.classList.contains('dark');
  const primarySafe = ensureTextContrast(primary, surfaceIsDark);
  const accentSafe = ensureTextContrast(accent, surfaceIsDark);

  const primaryHsl = hexToHslTriplet(primarySafe);
  const accentHsl = hexToHslTriplet(accentSafe);
  const primaryVividHsl = hexToHslTriplet(primary);
  const accentVividHsl = hexToHslTriplet(accent);
  if (!primaryHsl || !accentHsl) { clearClubTheme(); return; }

  // Contrast-safe on-colour ink (whichever of white / deep-navy reads better).
  const primaryInk = bestInk(primarySafe);
  const accentInk = bestInk(accentSafe);

  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--primary-foreground', primaryInk);
  root.style.setProperty('--ring', primaryVividHsl || primaryHsl);
  root.style.setProperty('--accent', accentHsl);
  root.style.setProperty('--accent-foreground', accentInk);
  root.style.setProperty('--sidebar-primary', accentVividHsl || accentHsl);
  root.style.setProperty('--sidebar-primary-foreground', bestInk(accent));
  root.style.setProperty('--sidebar-ring', accentVividHsl || accentHsl);
}

// Curated quick styles for the "change the club style" option. Each is a
// { primary, accent } pair; the first is the default brand.
export const CLUB_STYLE_PRESETS = [
  { name: 'Ocean', primary: '#0077B6', accent: '#00A6C8' },      // default brand — keep first
  { name: 'Sky', primary: '#0284c7', accent: '#38bdf8' },
  { name: 'Royal', primary: '#1d4ed8', accent: '#3b82f6' },
  { name: 'Indigo', primary: '#4f46e5', accent: '#6366f1' },
  { name: 'Violet', primary: '#7c3aed', accent: '#a78bfa' },
  { name: 'Magenta', primary: '#a21caf', accent: '#d946ef' },
  { name: 'Rose', primary: '#be123c', accent: '#f43f5e' },
  { name: 'Coral', primary: '#e11d48', accent: '#fb7185' },
  { name: 'Sunset', primary: '#ea580c', accent: '#f59e0b' },
  { name: 'Amber', primary: '#b45309', accent: '#f59e0b' },
  { name: 'Emerald', primary: '#047857', accent: '#10b981' },
  { name: 'Teal', primary: '#0f766e', accent: '#14b8a6' },
  { name: 'Lime', primary: '#4d7c0f', accent: '#84cc16' },
  { name: 'Slate', primary: '#334155', accent: '#64748b' },
  { name: 'Graphite', primary: '#1f2937', accent: '#6b7280' },
  { name: 'Black & Gold', primary: '#111827', accent: '#f59e0b' },
];
