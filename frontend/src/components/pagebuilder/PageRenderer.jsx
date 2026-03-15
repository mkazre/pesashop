import React, { memo, useMemo, useState, useEffect } from 'react';
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

// ── Badge position mapping (same as admin RenderNode) ────────────────────────
const BADGE_POSITION_STYLES = {
  'top-left':     { top: 0, left: 0 },
  'top-center':   { top: 0, left: '50%', transform: 'translateX(-50%)' },
  'top-right':    { top: 0, right: 0 },
  'middle-left':  { top: '50%', left: 0, transform: 'translateY(-50%)' },
  'middle-center':{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'middle-right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
  'bottom-left':  { bottom: 0, left: 0 },
  'bottom-center':{ bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 0, right: 0 },
};

// ── Global cache for module badges ───────────────────────────────────────────
let _moduleBadgesCache = [];
let _moduleBadgesFetchedAt = 0;
const MODULE_CACHE_TTL = 60000; // 60 seconds on frontend

const fetchModuleBadges = async () => {
  const now = Date.now();
  if (_moduleBadgesCache.length > 0 && now - _moduleBadgesFetchedAt < MODULE_CACHE_TTL) {
    return _moduleBadgesCache;
  }
  try {
    const API = `${import.meta.env?.VITE_API_URL || 'http://localhost:5000'}/api`;
    const res = await fetch(`${API}/badges/active/list`);
    const data = await res.json();
    if (data.success) {
      _moduleBadgesCache = data.data || [];
      _moduleBadgesFetchedAt = now;
    }
  } catch (err) {
    console.error('[PageRenderer] Failed to fetch module badges:', err);
  }
  return _moduleBadgesCache;
};

const useModuleBadges = (badgeIds) => {
  const [badges, setBadges] = useState([]);
  const idsKey = (badgeIds || []).join(',');
  useEffect(() => {
    if (!badgeIds || badgeIds.length === 0) { setBadges([]); return; }
    let cancelled = false;
    fetchModuleBadges().then((all) => {
      if (cancelled) return;
      const map = new Map(all.map((b) => [b._id, b]));
      setBadges(badgeIds.map((bid) => map.get(bid)).filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [idsKey]);
  return badges;
};

// ── Badge animation CSS (injected once) ─────────────────────────────────────
const BADGE_ANIMATION_MAP = {
  none: '',
  pulse: 'pb-badge-pulse',
  bounce: 'pb-badge-bounce',
  shake: 'pb-badge-shake',
  'fade-in': 'pb-badge-fade-in',
  'slide-in': 'pb-badge-slide-in',
  glow: 'pb-badge-glow',
  wiggle: 'pb-badge-wiggle',
  flip: 'pb-badge-flip',
};

const BADGE_ANIM_CSS = `
@keyframes pb-badge-pulse-kf { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
@keyframes pb-badge-bounce-kf { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
@keyframes pb-badge-shake-kf { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes pb-badge-fade-in-kf { from { opacity: 0; } to { opacity: 1; } }
@keyframes pb-badge-slide-in-kf { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pb-badge-glow-kf { 0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4); } }
@keyframes pb-badge-wiggle-kf { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
@keyframes pb-badge-flip-kf { 0% { transform: perspective(400px) rotateY(0); } 50% { transform: perspective(400px) rotateY(180deg); } 100% { transform: perspective(400px) rotateY(360deg); } }
.pb-badge-pulse { animation: pb-badge-pulse-kf 2s cubic-bezier(0.4,0,0.6,1) infinite; }
.pb-badge-bounce { animation: pb-badge-bounce-kf 1s infinite; }
.pb-badge-shake { animation: pb-badge-shake-kf 0.5s ease-in-out infinite; }
.pb-badge-fade-in { animation: pb-badge-fade-in-kf 1s ease-in; }
.pb-badge-slide-in { animation: pb-badge-slide-in-kf 0.5s ease-out; }
.pb-badge-glow { animation: pb-badge-glow-kf 2s ease-in-out infinite; }
.pb-badge-wiggle { animation: pb-badge-wiggle-kf 1s ease-in-out infinite; }
.pb-badge-flip { animation: pb-badge-flip-kf 1s ease-in-out infinite; }
`;

// Render a single module badge overlay
const ModuleBadgeOverlay = ({ badge, positionOverride }) => {
  const s = badge.style || {};
  const pos = positionOverride || s.position || 'top-right';
  const posStyle = pos === 'custom'
    ? { top: s.customTop || 'auto', right: s.customRight || 'auto', bottom: s.customBottom || 'auto', left: s.customLeft || 'auto' }
    : (BADGE_POSITION_STYLES[pos] || BADGE_POSITION_STYLES['top-right']);

  const transforms = [];
  if (posStyle.transform) transforms.push(posStyle.transform);
  if (s.rotate && s.rotate !== '0deg') transforms.push(`rotate(${s.rotate})`);
  if (s.scale && s.scale !== '1') transforms.push(`scale(${s.scale})`);

  const baseStyle = {
    position: 'absolute',
    zIndex: s.zIndex || 10,
    pointerEvents: 'none',
    ...posStyle,
    marginTop: s.marginTop || '8px',
    marginRight: s.marginRight || '8px',
    marginBottom: s.marginBottom || '0px',
    marginLeft: s.marginLeft || '0px',
  };
  if (transforms.length) baseStyle.transform = transforms.join(' ');

  const animClass = BADGE_ANIMATION_MAP[s.animation] || '';

  if (s.badgeType === 'image' && s.imageUrl) {
    return (
      <img
        src={s.imageUrl}
        alt={badge.name}
        className={`pb-module-badge ${animClass}`}
        style={{
          ...baseStyle,
          width: s.imageWidth || '60px',
          height: s.imageHeight || 'auto',
          objectFit: s.imageObjectFit || 'contain',
        }}
      />
    );
  }

  const bg = s.useGradient
    ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})`
    : (s.backgroundColor || '#ef4444');

  return (
    <span
      className={`pb-module-badge ${animClass}`}
      style={{
        ...baseStyle,
        color: s.textColor || '#ffffff',
        ...(s.useGradient ? { backgroundImage: bg, backgroundColor: 'transparent' } : { backgroundColor: bg }),
        fontSize: s.fontSize || '12px',
        fontWeight: s.fontWeight || '700',
        fontStyle: s.fontStyle || 'normal',
        textTransform: s.textTransform || 'uppercase',
        letterSpacing: s.letterSpacing || '0.5px',
        lineHeight: s.lineHeight || '1',
        paddingTop: s.paddingTop || '4px',
        paddingRight: s.paddingRight || '10px',
        paddingBottom: s.paddingBottom || '4px',
        paddingLeft: s.paddingLeft || '10px',
        borderRadius: s.borderRadius || '4px',
        borderWidth: s.borderWidth || '0px',
        borderStyle: s.borderStyle || 'solid',
        borderColor: s.borderColor || 'transparent',
        whiteSpace: 'nowrap',
        opacity: s.opacity || '1',
        boxShadow: s.boxShadow || '',
      }}
    >
      {s.text || badge.name || 'Badge'}
    </span>
  );
};

/**
 * ResponsiveRenderNode — wraps every Craft.js element on the frontend.
 * Reads style.responsive from the node's props and injects scoped <style>
 * tags with media queries for tablet/mobile overrides.
 * Also handles responsiveProps for element-specific overrides (e.g. Repeater columns).
 * Also renders module badges and manual badges from the Badge system.
 */
const ResponsiveRenderNode = ({ render }) => {
  const { id, responsive, responsiveProps, hoverStyles, focusStyles, customCSS,
          badge, badgeMode, badgeModuleIds, badgeOverrides } = useNode((state) => ({
    responsive: state.data?.props?.style?.responsive || null,
    responsiveProps: state.data?.props?.responsiveProps || null,
    hoverStyles: state.data?.props?.hoverStyles || null,
    focusStyles: state.data?.props?.focusStyles || null,
    customCSS: state.data?.props?.style?.customCSS || state.data?.props?.customCSS || '',
    badge: state.data?.props?.style?.badge || null,
    badgeMode: state.data?.props?.style?.badgeMode || 'module',
    badgeModuleIds: state.data?.props?.style?.badgeModuleIds || [],
    badgeOverrides: state.data?.props?.style?.badgeOverrides || {},
  }));

  // Fetch module badges when in module mode
  const moduleBadges = useModuleBadges(badgeMode === 'module' ? badgeModuleIds : []);

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
  const styleTag = hasStyles ? <style dangerouslySetInnerHTML={{ __html: cssRules.join('\n') }} /> : null;

  // Badge logic
  const hasManualBadge = badgeMode === 'manual' && badge && badge.enabled && badge.text;
  const hasModuleBadges = badgeMode === 'module' && moduleBadges.length > 0;
  const hasAnyBadge = hasManualBadge || hasModuleBadges;

  // No badges → simple wrapper
  if (!hasAnyBadge) {
    return (
      <div data-pb-id={id} style={{ display: 'contents' }}>
        {render}
        {styleTag}
      </div>
    );
  }

  // With badges → relative wrapper for absolute positioning
  return (
    <div data-pb-id={id} className="pb-badge-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {render}
      {styleTag}
      <style dangerouslySetInnerHTML={{ __html: BADGE_ANIM_CSS }} />

      {/* Module badges from Badge Manager */}
      {hasModuleBadges && moduleBadges.map((mb) => (
        <ModuleBadgeOverlay
          key={mb._id}
          badge={mb}
          positionOverride={badgeOverrides[mb._id]?.position || ''}
        />
      ))}

      {/* Legacy manual badge */}
      {hasManualBadge && (
        <span
          className="pb-manual-badge"
          style={{
            position: 'absolute',
            zIndex: 10,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            ...(BADGE_POSITION_STYLES[badge.position] || BADGE_POSITION_STYLES['top-right']),
            marginTop: badge.marginTop || '0px',
            marginRight: badge.marginRight || '0px',
            marginBottom: badge.marginBottom || '0px',
            marginLeft: badge.marginLeft || '0px',
            paddingTop: badge.paddingTop || '4px',
            paddingRight: badge.paddingRight || '8px',
            paddingBottom: badge.paddingBottom || '4px',
            paddingLeft: badge.paddingLeft || '8px',
            fontSize: badge.fontSize || '11px',
            fontWeight: badge.fontWeight || '700',
            fontStyle: badge.fontStyle || 'normal',
            textTransform: badge.textTransform || 'uppercase',
            letterSpacing: badge.letterSpacing || '0.5px',
            color: badge.color || '#ffffff',
            backgroundColor: badge.backgroundColor || '#ef4444',
            borderRadius: badge.borderRadius || '4px',
          }}
        >
          {badge.text}
        </span>
      )}
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
