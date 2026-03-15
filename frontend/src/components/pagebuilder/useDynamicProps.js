import { useMemo } from 'react';
import { useRepeaterContext } from './RepeaterContext';
import { usePageData } from './PageDataContext';
import { resolveDynamicProps, buildContextFromItem } from './dynamicData';

/**
 * Strip non-CSS keys from a style object so they don't become invalid inline styles.
 * Keys like 'responsive', 'responsiveProps', 'badge' are used by the system but
 * are not valid CSS properties.
 */
function cleanStyle(style) {
  if (!style || typeof style !== 'object') return style;
  const { responsive, responsiveProps, badge, badgeMode, badgeModuleIds, badgeOverrides, customCSS, ...clean } = style;
  return clean;
}

/**
 * useDynamicProps — Frontend hook for resolving dynamic bindings.
 * Resolves dynamic tokens (e.g. {{product.name}}) from TWO sources:
 *   1. RepeaterContext — when inside a Repeater element (loop items)
 *   2. PageDataContext — when on a page-builder template page (single-product, cart, etc.)
 * RepeaterContext takes priority so bindings inside a Repeater on a product page
 * resolve against the loop item, not the page-level product.
 * Also strips non-CSS keys from the style object.
 *
 * @param {Object} props - The element's raw props from Craft.js deserialization
 * @returns {Object} - Props with dynamic values resolved from context
 */
export function useDynamicProps(props) {
  const repeaterCtx = useRepeaterContext();
  const pageData = usePageData();

  return useMemo(() => {
    let resolved = props;

    if (props?.dynamicBindings) {
      let context = null;

      // Priority 1: RepeaterContext (inside a Repeater loop)
      if (repeaterCtx?.item) {
        context = buildContextFromItem(repeaterCtx.item, repeaterCtx.dataSource || 'products');
      }
      // Priority 2: PageDataContext (page-level data like current product)
      else if (pageData) {
        context = {};
        if (pageData.product) context.product = pageData.product;
        if (pageData.cart) context.cart = pageData.cart;
      }

      if (context && Object.keys(context).length > 0) {
        resolved = resolveDynamicProps(props, context);
      }
    }

    // Strip non-CSS keys from style to prevent invalid inline styles
    if (resolved?.style && (resolved.style.responsive || resolved.style.responsiveProps || resolved.style.badge || resolved.style.badgeMode || resolved.style.badgeModuleIds || resolved.style.badgeOverrides || resolved.style.customCSS)) {
      return { ...resolved, style: cleanStyle(resolved.style) };
    }

    return resolved;
  }, [props, repeaterCtx, pageData]);
}

export default useDynamicProps;
