// Curated Google Fonts catalog — shared by admin (Typography pickers/preview)
// and frontend (dynamic <link> injection). Kept byte-identical to its
// counterpart at src/constants/fontRegistry.js in the other app.
//
// `googleFamily` is the exact value to place after `family=` in a Google
// Fonts css2 request (https://fonts.googleapis.com/css2?family=<googleFamily>&display=swap).
// Weight lists use the widely-supported static weight cuts for each family
// (e.g. `:wght@400;600;700`) rather than variable-axis ranges — Google's
// css2 API gracefully skips any requested weight a family doesn't have, so
// this resolves cleanly for every entry regardless of whether the family is
// served as a variable font.

export const FONT_CATALOG = [
  // Sans-serif
  { name: 'Inter', googleFamily: 'Inter:wght@400;500;600;700;800', category: 'sans-serif' },
  { name: 'Manrope', googleFamily: 'Manrope:wght@400;500;600;700;800', category: 'sans-serif' },
  { name: 'Poppins', googleFamily: 'Poppins:wght@400;500;600;700;800', category: 'sans-serif' },
  { name: 'Work Sans', googleFamily: 'Work+Sans:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'DM Sans', googleFamily: 'DM+Sans:wght@400;500;700', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', googleFamily: 'Plus+Jakarta+Sans:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Outfit', googleFamily: 'Outfit:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Space Grotesk', googleFamily: 'Space+Grotesk:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Urbanist', googleFamily: 'Urbanist:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Sora', googleFamily: 'Sora:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Nunito', googleFamily: 'Nunito:wght@400;600;700;800', category: 'sans-serif' },
  { name: 'Rubik', googleFamily: 'Rubik:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Barlow', googleFamily: 'Barlow:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Roboto', googleFamily: 'Roboto:wght@400;500;700', category: 'sans-serif' },
  { name: 'Open Sans', googleFamily: 'Open+Sans:wght@400;600;700', category: 'sans-serif' },
  { name: 'Montserrat', googleFamily: 'Montserrat:wght@400;600;700;800', category: 'sans-serif' },
  { name: 'Raleway', googleFamily: 'Raleway:wght@400;600;700', category: 'sans-serif' },
  { name: 'IBM Plex Sans', googleFamily: 'IBM+Plex+Sans:wght@400;500;600;700', category: 'sans-serif' },
  { name: 'Figtree', googleFamily: 'Figtree:wght@400;500;600;700', category: 'sans-serif' },

  // Serif
  { name: 'Lora', googleFamily: 'Lora:wght@400;500;600;700', category: 'serif' },
  { name: 'Playfair Display', googleFamily: 'Playfair+Display:wght@400;600;700;800', category: 'serif' },
  { name: 'Merriweather', googleFamily: 'Merriweather:wght@400;700;900', category: 'serif' },
  { name: 'Cormorant Garamond', googleFamily: 'Cormorant+Garamond:wght@400;500;600;700', category: 'serif' },
  { name: 'Libre Baskerville', googleFamily: 'Libre+Baskerville:wght@400;700', category: 'serif' },
  { name: 'PT Serif', googleFamily: 'PT+Serif:wght@400;700', category: 'serif' },
  { name: 'EB Garamond', googleFamily: 'EB+Garamond:wght@400;500;600;700', category: 'serif' },
  { name: 'Crimson Pro', googleFamily: 'Crimson+Pro:wght@400;500;600;700', category: 'serif' },
  { name: 'Fraunces', googleFamily: 'Fraunces:wght@400;500;600;700', category: 'serif' },

  // Display
  { name: 'Bebas Neue', googleFamily: 'Bebas+Neue', category: 'display' },
  { name: 'Oswald', googleFamily: 'Oswald:wght@400;500;600;700', category: 'display' },
  { name: 'Josefin Sans', googleFamily: 'Josefin+Sans:wght@400;500;600;700', category: 'display' },
  { name: 'Abril Fatface', googleFamily: 'Abril+Fatface', category: 'display' },
  { name: 'Archivo Black', googleFamily: 'Archivo+Black', category: 'display' },

  // Monospace
  { name: 'JetBrains Mono', googleFamily: 'JetBrains+Mono:wght@400;500;600;700', category: 'monospace' },
  { name: 'Space Mono', googleFamily: 'Space+Mono:wght@400;700', category: 'monospace' },
  { name: 'IBM Plex Mono', googleFamily: 'IBM+Plex+Mono:wght@400;500;600', category: 'monospace' },
];

export const FONT_BY_NAME = Object.fromEntries(FONT_CATALOG.map((f) => [f.name, f]));

/**
 * Group the catalog for a categorized picker UI ([{ category, items }, ...]).
 */
export function getFontsByCategory() {
  const groups = new Map();
  for (const f of FONT_CATALOG) {
    if (!groups.has(f.category)) groups.set(f.category, []);
    groups.get(f.category).push(f);
  }
  return [...groups.entries()].map(([category, items]) => ({ category, items }));
}

/**
 * Build a single Google Fonts css2 URL requesting several families at once
 * (deduped, unknown/blank names skipped). Returns null if nothing to load.
 */
export function buildGoogleFontsUrl(names) {
  const families = [...new Set((names || []).filter(Boolean))]
    .map((n) => FONT_BY_NAME[n]?.googleFamily)
    .filter(Boolean);
  if (families.length === 0) return null;
  const params = families.map((f) => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Quote a font name for use as a CSS font-family value/custom property
 * (only needed for multi-word names, e.g. "Work Sans" -> '"Work Sans"').
 */
export function toCssFontFamily(name) {
  if (!name) return '';
  return /\s/.test(name) ? `"${name}"` : name;
}

/**
 * Resolve the effective { body, heading } font names for a page, given the
 * typography settings object ({ global: { body, heading }, pages: { ... } })
 * and a page key ('home' | 'shop' | 'product' | 'account' | 'custom' | null).
 * An empty body/heading at any level means "inherit" — a page with no body
 * override falls back to the global body; a page (or global) with no
 * heading override uses that same level's resolved body font. Shared so the
 * admin preview and the live storefront resolve fonts identically.
 */
export function resolveTypography(typography, pageKey) {
  const global = typography?.global || {};
  const globalBody = global.body || 'Inter';
  const globalHeading = global.heading || globalBody;

  const page = pageKey ? typography?.pages?.[pageKey] : null;
  const body = page?.body || globalBody;
  const heading = page?.heading || page?.body || globalHeading;

  return { body, heading };
}
