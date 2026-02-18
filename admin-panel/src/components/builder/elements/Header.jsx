import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Header = ({
  children,
  sticky = false,
  transparent = false,
  backgroundColor = '#ffffff',
  shadow = true,
  fullWidth = false,
  maxWidth = '1280px',
  padding = '0',
  zIndex = 50,
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  return (
    <header
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        boxShadow: shadow ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        padding,
        display: 'flex',
        flexDirection: 'column',
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 0 : undefined,
        zIndex,
        width: '100%',
        maxWidth: fullWidth ? '100%' : undefined,
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
        minHeight: '60px',
      }}
    >
      {children || (
        <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', border: '2px dashed #e5e7eb', borderRadius: '8px', margin: '8px' }}>
          Header — drop Header Row elements here to build your header
        </div>
      )}
    </header>
  );
};

export const HeaderSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';
  const checkCls = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Header Settings</h4>
      <p className="text-[11px] text-gray-500">
        The Header is a container for Header Row elements. Add multiple rows (top bar, main header, nav bar) and drag elements into each row.
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!props.sticky} onChange={(e) => setProp((p) => { p.sticky = e.target.checked; })} className={checkCls} />
          <label className="text-xs text-gray-600">Sticky Header</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!props.transparent} onChange={(e) => setProp((p) => { p.transparent = e.target.checked; })} className={checkCls} />
          <label className="text-xs text-gray-600">Transparent</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={props.shadow !== false} onChange={(e) => setProp((p) => { p.shadow = e.target.checked; })} className={checkCls} />
          <label className="text-xs text-gray-600">Box Shadow</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!props.fullWidth} onChange={(e) => setProp((p) => { p.fullWidth = e.target.checked; })} className={checkCls} />
          <label className="text-xs text-gray-600">Full Width</label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Background Color</label>
          <div className="flex gap-1">
            <input type="color" value={props.backgroundColor || '#ffffff'} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })}
              className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={props.backgroundColor || ''} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })}
              className={inputCls} placeholder="#ffffff" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Z-Index</label>
          <input type="number" value={props.zIndex || 50} onChange={(e) => setProp((p) => { p.zIndex = Number(e.target.value); })}
            className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Padding</label>
          <input type="text" value={props.padding || '0'} onChange={(e) => setProp((p) => { p.padding = e.target.value; })}
            className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Max Width</label>
          <input type="text" value={props.maxWidth || '1280px'} onChange={(e) => setProp((p) => { p.maxWidth = e.target.value; })}
            className={inputCls} placeholder="1280px" />
        </div>
      </div>
    </div>
  );
};

Header.craft = {
  displayName: 'Header',
  props: {
    sticky: false, transparent: false, backgroundColor: '#ffffff', shadow: true,
    fullWidth: false, maxWidth: '1280px', padding: '0', zIndex: 50,
    className: '', style: {}, dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
  related: { settings: HeaderSettings },
};
