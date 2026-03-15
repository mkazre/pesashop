import { useMemo } from 'react';
import { useRepeaterContext } from './RepeaterContext';
import { resolveDynamicProps, resolveDynamicValue, buildContextFromItem, isDynamicValue } from './dynamicData';
import { resolveStyles } from './resolveStyles';

/**
 * useDynamicProps — Hook for admin builder elements.
 * Reads the current RepeaterContext item + dataSource and resolves any dynamic
 * bindings in the element's props. Returns the resolved props object.
 * Also auto-resolves nested style objects (padding/margin/border objects from
 * AdvancedSpacingControl, AdvancedBorderControl, etc.) into flat CSS values.
 *
 * Usage in any element:
 *   const resolved = useDynamicProps(props);
 *   // Use resolved.content, resolved.src, etc. — they'll be real data if bound
 *   // resolved.style is already flattened for direct use in JSX style={}
 *
 * @param {Object} props - The element's raw props from Craft.js
 * @returns {Object} - Props with dynamic values resolved and styles flattened
 */
export function useDynamicProps(props) {
  const repeaterCtx = useRepeaterContext();

  return useMemo(() => {
    let resolved = props;
    if (props?.dynamicBindings && repeaterCtx?.item) {
      const context = buildContextFromItem(repeaterCtx.item, repeaterCtx.dataSource || 'products');
      resolved = resolveDynamicProps(props, context);
    }

    // Auto-resolve nested style objects so elements can use style={} directly
    if (resolved?.style && typeof resolved.style === 'object') {
      return { ...resolved, style: resolveStyles(resolved.style) };
    }
    return resolved;
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
