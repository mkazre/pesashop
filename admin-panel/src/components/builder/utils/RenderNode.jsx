import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNode, useEditor, ROOT_NODE } from '@craftjs/core';
import { ContextMenu } from '@/components/builder/utils/ContextMenu';
import { useClipboard } from '@/components/builder/utils/Clipboard';

// Position mapping for badge placement
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

// ── Global cache for module badges fetched from the API ──────────────────────
let _moduleBadgesCache = [];
let _moduleBadgesFetchedAt = 0;
const MODULE_CACHE_TTL = 30000; // 30 seconds

const fetchModuleBadges = async () => {
  const now = Date.now();
  if (_moduleBadgesCache.length > 0 && now - _moduleBadgesFetchedAt < MODULE_CACHE_TTL) {
    return _moduleBadgesCache;
  }
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const API = `${import.meta.env?.VITE_API_URL || 'http://localhost:5000'}/api`;
    const res = await fetch(`${API}/badges/active/list`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (data.success) {
      _moduleBadgesCache = data.data || [];
      _moduleBadgesFetchedAt = now;
    }
  } catch (err) {
    console.error('RenderNode: failed to fetch module badges', err);
  }
  return _moduleBadgesCache;
};

// Hook to get module badges with caching
const useModuleBadges = (badgeIds) => {
  const [badges, setBadges] = useState([]);
  const idsKey = (badgeIds || []).join(',');
  useEffect(() => {
    if (!badgeIds || badgeIds.length === 0) { setBadges([]); return; }
    let cancelled = false;
    fetchModuleBadges().then((all) => {
      if (cancelled) return;
      const map = new Map(all.map((b) => [b._id, b]));
      setBadges(badgeIds.map((id) => map.get(id)).filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [idsKey]);
  return badges;
};

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

  if (s.badgeType === 'image' && s.imageUrl) {
    return (
      <img
        src={s.imageUrl}
        alt={badge.name}
        className="craft-module-badge"
        style={{
          ...baseStyle,
          width: s.imageWidth || '60px',
          height: s.imageHeight || 'auto',
          objectFit: s.imageObjectFit || 'contain',
        }}
      />
    );
  }

  // Text badge
  const bg = s.useGradient
    ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})`
    : (s.backgroundColor || '#ef4444');

  return (
    <span
      className="craft-module-badge"
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

// Convert a JS style object to CSS string (camelCase → kebab-case)
const styleToCss = (styleObj) => {
  if (!styleObj || typeof styleObj !== 'object') return '';
  return Object.entries(styleObj)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v} !important;`)
    .join(' ');
};

/**
 * RenderNode — used as the onRender handler for Craft.js Editor.
 * Elements already handle their own connect/drag connectors, so this wrapper
 * only adds a badge overlay when style.badge is configured on the node.
 * Also injects hover/focus CSS when hoverStyles/focusStyles props are set.
 * Also provides right-click context menu for all canvas elements.
 */
export const RenderNode = ({ render }) => {
  const { id, badge, badgeMode, badgeModuleIds, badgeOverrides, displayName, hoverStyles, focusStyles, customCSS, elementId } = useNode((state) => ({
    badge: state.data?.props?.style?.badge || null,
    badgeMode: state.data?.props?.style?.badgeMode || 'module',
    badgeModuleIds: state.data?.props?.style?.badgeModuleIds || [],
    badgeOverrides: state.data?.props?.style?.badgeOverrides || {},
    displayName: state.data?.displayName || state.data?.name || state.data?.type?.resolvedName || 'Component',
    hoverStyles: state.data?.props?.hoverStyles || null,
    focusStyles: state.data?.props?.focusStyles || null,
    customCSS: state.data?.props?.customCSS || '',
    elementId: state.data?.props?.elementId || '',
  }));

  // Fetch module badges when in module mode
  const moduleBadges = useModuleBadges(badgeMode === 'module' ? badgeModuleIds : []);
  const { actions } = useEditor();
  const clipboard = useClipboard();
  const [ctxMenu, setCtxMenu] = useState(null);

  const isRoot = id === ROOT_NODE || id === 'ROOT';

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    actions.selectNode(id);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = () => {
    if (isRoot) return;
    const name = displayName;
    if (window.confirm(`Delete "${name}"?`)) {
      try { actions.delete(id); } catch (err) { console.error('Delete failed:', err); }
    }
  };

  const hasManualBadge = badgeMode === 'manual' && badge && badge.enabled && badge.text;
  const hasModuleBadges = badgeMode === 'module' && moduleBadges.length > 0;
  const hasAnyBadge = hasManualBadge || hasModuleBadges;

  // Build hover/focus CSS rules scoped to this element's data-craft-id
  const hoverCss = hoverStyles && Object.keys(hoverStyles).length > 0 ? styleToCss(hoverStyles) : '';
  const focusCss = focusStyles && Object.keys(focusStyles).length > 0 ? styleToCss(focusStyles) : '';
  const hasInteractiveStyles = hoverCss || focusCss || customCSS;
  const interactiveStyleTag = hasInteractiveStyles ? (
    <style dangerouslySetInnerHTML={{ __html: [
      hoverCss ? `[data-craft-id="${id}"]:hover { ${hoverCss} }` : '',
      focusCss ? `[data-craft-id="${id}"]:focus, [data-craft-id="${id}"]:focus-within { ${focusCss} }` : '',
      customCSS || '',
    ].filter(Boolean).join('\n') }} />
  ) : null;

  const contextMenuPortal = ctxMenu && ReactDOM.createPortal(
    <ContextMenu
      x={ctxMenu.x}
      y={ctxMenu.y}
      onClose={() => setCtxMenu(null)}
      nodeName={displayName}
      isRoot={isRoot}
      onCopy={() => clipboard.copy(id)}
      onCut={() => clipboard.cut(id)}
      onPaste={() => clipboard.paste(id)}
      onDuplicate={() => clipboard.duplicate(id)}
      onDelete={handleDelete}
      onWrapWithDiv={!isRoot ? () => clipboard.wrapWithDiv(id) : undefined}
      onMoveUp={!isRoot ? () => clipboard.moveUp(id) : undefined}
      onMoveDown={!isRoot ? () => clipboard.moveDown(id) : undefined}
      onSelectParent={!isRoot ? () => clipboard.selectParent(id) : undefined}
      onCopyStyle={() => clipboard.copyStyle(id)}
      onPasteStyle={() => clipboard.pasteStyle(id)}
      hasClipboard={clipboard.hasClipboard}
      hasStyleClipboard={clipboard.hasStyleClipboard}
    />,
    document.body
  );

  // No badges → render element with just the context menu handler
  if (!hasAnyBadge) {
    return (
      <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
        {render}
        {interactiveStyleTag}
        {contextMenuPortal}
      </div>
    );
  }

  return (
    <div className="craft-badge-wrapper" onContextMenu={handleContextMenu} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {render}
      {interactiveStyleTag}

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
          className="craft-badge"
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

      {contextMenuPortal}
    </div>
  );
};
