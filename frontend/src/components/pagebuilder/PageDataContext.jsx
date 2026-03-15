import React, { createContext, useContext, useEffect, useRef } from 'react';

/**
 * PageDataContext — provides page-level data (e.g. the current product on a
 * single-product page) to ALL page-builder elements rendered inside PageRenderer.
 *
 * Uses BOTH React context AND a module-level store because Craft.js <Frame>
 * does not propagate React context to components rendered inside it.
 * The module-level store ensures usePageData() works inside Craft.js Frame.
 */
const PageDataCtx = createContext(null);

// Module-level store for page data — accessible inside Craft.js Frame
let _pageData = null;

export const PageDataProvider = ({ product, cart, children }) => {
  const value = { product: product || null, cart: cart || null };
  // Keep module-level store in sync
  const ref = useRef(value);
  ref.current = value;
  _pageData = value;

  useEffect(() => {
    _pageData = ref.current;
    return () => { _pageData = null; };
  }, [product, cart]);

  return (
    <PageDataCtx.Provider value={value}>
      {children}
    </PageDataCtx.Provider>
  );
};

/**
 * usePageData — returns the page-level data context.
 * Tries React context first, falls back to module-level store for Craft.js Frame.
 * @returns {{ product: Object|null, cart: Object|null }}
 */
export const usePageData = () => {
  const ctx = useContext(PageDataCtx);
  return ctx || _pageData;
};
