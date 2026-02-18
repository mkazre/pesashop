import { useMemo } from 'react';
import { useRepeaterContext } from './RepeaterContext';
import { resolveDynamicProps, resolveDynamicValue, buildContextFromItem, isDynamicValue } from './dynamicData';

/**
 * useDynamicProps — Hook for admin builder elements.
 * Reads the current RepeaterContext item + dataSource and resolves any dynamic
 * bindings in the element's props. Returns the resolved props object.
 *
 * Usage in any element:
 *   const resolved = useDynamicProps(props);
 *   // Use resolved.content, resolved.src, etc. — they'll be real data if bound
 *
 * @param {Object} props - The element's raw props from Craft.js
 * @returns {Object} - Props with dynamic values resolved from context
 */
export function useDynamicProps(props) {
  const repeaterCtx = useRepeaterContext();

  return useMemo(() => {
    if (!props?.dynamicBindings || !repeaterCtx?.item) return props;

    const context = buildContextFromItem(repeaterCtx.item, repeaterCtx.dataSource || 'products');
    return resolveDynamicProps(props, context);
  }, [props, repeaterCtx]);
}

/**
 * useDynamicValue — Resolve a single prop value that might be dynamic.
 * Useful when you only need one value resolved.
 */
export function useDynamicValue(value) {
  const repeaterCtx = useRepeaterContext();

  return useMemo(() => {
    if (!isDynamicValue(value) || !repeaterCtx?.item) return value;

    const context = buildContextFromItem(repeaterCtx.item, repeaterCtx.dataSource || 'products');
    return resolveDynamicValue(value, context);
  }, [value, repeaterCtx]);
}

export default useDynamicProps;
