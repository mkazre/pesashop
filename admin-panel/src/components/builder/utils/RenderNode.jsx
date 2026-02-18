import React, { useState } from 'react';
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
  'middle-right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
  'bottom-left':  { bottom: 0, left: 0 },
  'bottom-center':{ bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 0, right: 0 },
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
  const { id, badge, displayName, hoverStyles, focusStyles, customCSS, elementId } = useNode((state) => ({
    badge: state.data?.props?.style?.badge || null,
    displayName: state.data?.displayName || state.data?.name || state.data?.type?.resolvedName || 'Component',
    hoverStyles: state.data?.props?.hoverStyles || null,
    focusStyles: state.data?.props?.focusStyles || null,
    customCSS: state.data?.props?.customCSS || '',
    elementId: state.data?.props?.elementId || '',
  }));
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

  const hasBadge = badge && badge.enabled && badge.text;

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

  // No badge → render element with just the context menu handler
  if (!hasBadge) {
    return (
      <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
        {render}
        {interactiveStyleTag}
        {contextMenuPortal}
      </div>
    );
  }

  return (
    <div className="craft-badge-wrapper" onContextMenu={handleContextMenu} style={{ position: 'relative', display: 'contents' }}>
      <div style={{ position: 'relative' }}>
        {render}
        {interactiveStyleTag}
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
      </div>
      {contextMenuPortal}
    </div>
  );
};
