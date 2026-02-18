import React, { createContext, useContext } from 'react';

/**
 * PageDataContext — provides page-level data (e.g. the current product on a
 * single-product page) to ALL page-builder elements rendered inside PageRenderer.
 *
 * This is separate from RepeaterContext because:
 * 1. RepeaterContext is for looping over items (products/categories) inside a Repeater.
 * 2. PageDataContext is for the single "current" item the whole page is about.
 * 3. Craft.js <Frame> renders its own component tree, and this context propagates
 *    through it because it's placed OUTSIDE the <Editor> wrapper in PageRenderer.
 */
const PageDataCtx = createContext(null);

export const PageDataProvider = ({ product, cart, children }) => (
  <PageDataCtx.Provider value={{ product: product || null, cart: cart || null }}>
    {children}
  </PageDataCtx.Provider>
);

/**
 * usePageData — returns the page-level data context.
 * @returns {{ product: Object|null, cart: Object|null }}
 */
export const usePageData = () => useContext(PageDataCtx);
