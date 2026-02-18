import React, { createContext, useContext } from 'react';

const RepeaterItemContext = createContext(null);

/**
 * RepeaterItemProvider — wraps children with repeater item context.
 * @param {Object} value - The raw data item (product or category object)
 * @param {string} dataSource - 'products' | 'categories' — tells children what type of data this is
 */
export const RepeaterItemProvider = ({ value, dataSource = 'products', children }) => (
  <RepeaterItemContext.Provider value={{ item: value, dataSource }}>
    {children}
  </RepeaterItemContext.Provider>
);

/**
 * useRepeaterItem — returns the raw item from the nearest RepeaterItemProvider.
 * For backward compatibility, if the context value is a plain object without
 * the { item, dataSource } shape, it returns the value directly.
 */
export const useRepeaterItem = () => {
  const ctx = useContext(RepeaterItemContext);
  if (!ctx) return null;
  // New shape: { item, dataSource }
  if (ctx.item !== undefined && ctx.dataSource !== undefined) return ctx.item;
  // Legacy shape: raw item object
  return ctx;
};

/**
 * useRepeaterContext — returns the full context { item, dataSource }.
 */
export const useRepeaterContext = () => useContext(RepeaterItemContext);
