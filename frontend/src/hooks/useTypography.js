import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { settingsAPI } from '@/services/api';
import { buildGoogleFontsUrl, toCssFontFamily, resolveTypography } from '@/constants/fontRegistry';

const DEFAULT_TYPOGRAPHY = {
  global: { body: 'Inter', heading: '' },
  pages: {
    home: { body: '', heading: '' },
    shop: { body: '', heading: '' },
    product: { body: '', heading: '' },
    account: { body: '', heading: '' },
    custom: { body: '', heading: '' },
  },
};

// Module-level cache + in-flight dedup, same pattern as useProductDisplay.js —
// several components could mount before the first request resolves.
let cachedTypography = null;
let fetchPromise = null;

function fetchTypography() {
  if (cachedTypography) return Promise.resolve(cachedTypography);
  if (fetchPromise) return fetchPromise;
  fetchPromise = settingsAPI.getPublic()
    .then((res) => {
      cachedTypography = res.data?.data?.typography || DEFAULT_TYPOGRAPHY;
      return cachedTypography;
    })
    .catch(() => {
      cachedTypography = DEFAULT_TYPOGRAPHY;
      return cachedTypography;
    });
  return fetchPromise;
}

// Google Fonts <link> tags already injected this session, deduped by font name.
const injectedFonts = new Set(['Inter']); // Inter is already statically linked in index.html

function ensureFontsLoaded(typography) {
  const names = [
    typography.global?.body,
    typography.global?.heading,
    ...Object.values(typography.pages || {}).flatMap((p) => [p?.body, p?.heading]),
  ].filter(Boolean);

  const toLoad = [...new Set(names)].filter((n) => !injectedFonts.has(n));
  if (toLoad.length === 0) return;

  const href = buildGoogleFontsUrl(toLoad);
  if (!href) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  toLoad.forEach((n) => injectedFonts.add(n));
}

// Route -> typography.pages key. Mirrors the routes nested under <Layout/> in
// App.jsx: '/' -> home; '/shop' & '/shop/:category' -> shop;
// '/product/:slug' -> product; '/account/*' -> account; '/page/:slug' and the
// ':slug' catch-all (DynamicPage) -> custom. Everything else (cart, checkout,
// wishlist, etc.) has no override bucket and just uses the global fonts.
const KNOWN_TOP_SEGMENTS = new Set([
  'shop', 'product', 'cart', 'checkout', 'gift-cards', 'order-success',
  'account', 'refer', 'live', 'wishlist', 'categories', 'service-providers',
  'compare', 'page',
]);

function getPageBucket(pathname) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 0) return 'home';
  const first = segs[0];
  if (first === 'shop') return 'shop';
  if (first === 'product') return 'product';
  if (first === 'account') return 'account';
  if (first === 'page') return 'custom';
  if (KNOWN_TOP_SEGMENTS.has(first)) return null;
  // Anything else with a single segment matches the ':slug' catch-all route,
  // which renders DynamicPage — treat it as a custom page.
  return segs.length === 1 ? 'custom' : null;
}

function applyFonts(typography, pathname) {
  const { body, heading } = resolveTypography(typography, getPageBucket(pathname));
  const root = document.documentElement.style;
  root.setProperty('--font-body', toCssFontFamily(body));
  root.setProperty('--font-heading', toCssFontFamily(heading));
}

/**
 * Loads the storefront's typography settings once, injects the Google Fonts
 * referenced by it (deduped, display=swap), sets --font-body/--font-heading
 * on :root from the global config, and re-applies them on every route change
 * to honor that page's override (reverting to global when it leaves one).
 * Call once, near the app root (e.g. the main <Layout/>).
 */
export function useTypography() {
  const location = useLocation();
  const typographyRef = useRef(DEFAULT_TYPOGRAPHY);

  useEffect(() => {
    let cancelled = false;
    fetchTypography().then((t) => {
      if (cancelled) return;
      typographyRef.current = t;
      ensureFontsLoaded(t);
      // Use the live pathname (not the pathname this effect closed over) in
      // case navigation already happened while the request was in flight.
      applyFonts(t, window.location.pathname);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFonts(typographyRef.current, location.pathname);
  }, [location.pathname]);
}

export default useTypography;
