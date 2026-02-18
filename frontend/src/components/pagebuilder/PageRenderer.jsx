import React, { memo, useMemo } from 'react';
import { Editor, Frame, useNode } from '@craftjs/core';
import { pageBuilderResolver } from './index';
import { PageDataProvider } from './PageDataContext';

/**
 * Breakpoint media queries — must match admin ResponsiveControls.
 * Desktop is the default (no media query needed).
 */
const MEDIA_QUERIES = {
  tablet: '@media (max-width: 1024px)',
  phone: '@media (max-width: 767px)',
};

/** Convert camelCase to kebab-case */
const toKebab = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase();

/** Convert a JS style object to CSS declarations */
const styleToCss = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  return Object.entries(obj)
    .filter(([k, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => {
      if ((k === 'padding' || k === 'margin') && typeof v === 'object' && !Array.isArray(v)) {
        const { top = 0, right = 0, bottom = 0, left = 0 } = v;
        return `${toKebab(k)}: ${top}px ${right}px ${bottom}px ${left}px !important`;
      }
      return `${toKebab(k)}: ${v} !important`;
    })
    .join('; ');
};

/**
 * ResponsiveRenderNode — wraps every Craft.js element on the frontend.
 * Reads style.responsive from the node's props and injects scoped <style>
 * tags with media queries for tablet/mobile overrides.
 * Also handles responsiveProps for element-specific overrides (e.g. Repeater columns).
 */
const ResponsiveRenderNode = ({ render }) => {
  const { id, responsive, responsiveProps, hoverStyles, focusStyles, customCSS } = useNode((state) => ({
    responsive: state.data?.props?.style?.responsive || null,
    responsiveProps: state.data?.props?.responsiveProps || null,
    hoverStyles: state.data?.props?.hoverStyles || null,
    focusStyles: state.data?.props?.focusStyles || null,
    customCSS: state.data?.props?.style?.customCSS || state.data?.props?.customCSS || '',
  }));

  // Build responsive CSS
  const cssRules = [];
  // Target the actual element rendered by the component (first child of the wrapper)
  const elSelector = `[data-pb-id="${id}"] > *:first-child`;
  // For hover/focus we also need the direct child selector
  const hoverSelector = `[data-pb-id="${id}"] > *:first-child`;

  if (responsive) {
    for (const [bp, mq] of Object.entries(MEDIA_QUERIES)) {
      const overrides = responsive[bp];
      if (overrides && Object.keys(overrides).length > 0) {
        const css = styleToCss(overrides);
        if (css) cssRules.push(`${mq} { ${elSelector} { ${css}; } }`);
      }
    }
  }

  // Responsive element-specific props (e.g. Repeater/Gallery/ProductGrid columns/gap, Slider slidesPerView)
  if (responsiveProps) {
    for (const [bp, mq] of Object.entries(MEDIA_QUERIES)) {
      const overrides = responsiveProps[bp];
      if (overrides && Object.keys(overrides).length > 0) {
        const gridCss = [];
        if (overrides.columns) gridCss.push(`grid-template-columns: repeat(${overrides.columns}, 1fr) !important`);
        if (overrides.gap) gridCss.push(`gap: ${overrides.gap} !important`);
        if (gridCss.length > 0) {
          // Target the element itself if it's a grid, OR any grid child inside it
          // This covers Repeater (.repeater-grid), Gallery (.gallery-grid), ProductGrid, CSSGrid, etc.
          const gridSelector = `${elSelector}[style*="grid"], ${elSelector} > div[style*="grid"], ${elSelector} .repeater-grid, ${elSelector} .gallery-grid`;
          cssRules.push(`${mq} { ${gridSelector} { ${gridCss.join('; ')}; } }`);
        }
      }
    }
  }

  // Hover/focus styles
  const hoverCss = hoverStyles && Object.keys(hoverStyles).length > 0 ? styleToCss(hoverStyles) : '';
  const focusCss = focusStyles && Object.keys(focusStyles).length > 0 ? styleToCss(focusStyles) : '';
  if (hoverCss) cssRules.push(`${hoverSelector}:hover { ${hoverCss}; }`);
  if (focusCss) cssRules.push(`${hoverSelector}:focus, ${hoverSelector}:focus-within { ${focusCss}; }`);

  // Custom CSS
  if (customCSS) cssRules.push(customCSS);

  const hasStyles = cssRules.length > 0;

  return (
    <div data-pb-id={id} style={{ display: 'contents' }}>
      {render}
      {hasStyles && <style dangerouslySetInnerHTML={{ __html: cssRules.join('\n') }} />}
    </div>
  );
};

/**
 * Renders a page built in the admin page builder (Craft.js serialized state).
 * Uses Editor + Frame with resolver so components deserialize correctly.
 * ResponsiveRenderNode wraps every element to inject responsive media query CSS.
 * Memoized to prevent re-mount loops.
 */
function PageRenderer({ components, className = '', product = null, cart = null }) {
  const data = useMemo(() => {
    if (!components) return null;
    let parsed = components;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return null; }
    }
    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) return null;
    return parsed;
  }, [components]);

  if (!data) return null;

  try {
    const content = (
      <div className={`page-builder-content ${className}`}>
        <Editor resolver={pageBuilderResolver} enabled={false} onRender={ResponsiveRenderNode}>
          <Frame data={data} />
        </Editor>
      </div>
    );

    // Wrap with PageDataProvider if any page-level data is provided
    if (product || cart) {
      return (
        <PageDataProvider product={product} cart={cart}>
          {content}
        </PageDataProvider>
      );
    }

    return content;
  } catch (err) {
    console.error('[PageRenderer] Error rendering page:', err);
    return null;
  }
}

export default memo(PageRenderer);
