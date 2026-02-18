import React, { createContext, useContext } from 'react';

const RepeaterItemContext = createContext(null);

/**
 * RepeaterItemProvider — wraps children with repeater item context.
 * @param {Object} value - The raw data item (product or category object)
 * @param {string} dataSource - 'products' | 'categories'
 */
export const RepeaterItemProvider = ({ value, dataSource = 'products', children }) => (
  <RepeaterItemContext.Provider value={{ item: value, dataSource }}>
    {children}
  </RepeaterItemContext.Provider>
);

/**
 * useRepeaterItem — returns the raw item from the nearest RepeaterItemProvider.
 * Backward-compatible: handles both new { item, dataSource } and legacy raw item shapes.
 */
export const useRepeaterItem = () => {
  const ctx = useContext(RepeaterItemContext);
  if (!ctx) return null;
  if (ctx.item !== undefined && ctx.dataSource !== undefined) return ctx.item;
  return ctx;
};

/**
 * useRepeaterContext — returns the full context { item, dataSource }.
 */
export const useRepeaterContext = () => useContext(RepeaterItemContext);
