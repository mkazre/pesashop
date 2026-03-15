import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const HeaderRow = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  children,
  layout = 'space-between',
  alignItems = 'center',
  backgroundColor = 'transparent',
  textColor = '',
  padding = '8px 0',
  gap = '16px',
  borderBottom = '',
  minHeight = '40px',
  fullWidth = true,
  containerMaxWidth = '1280px',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  const innerStyle = fullWidth ? {} : { maxWidth: containerMaxWidth, margin: '0 auto', width: '100%' };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        backgroundColor,
        borderBottom: borderBottom || undefined,
        color: textColor || undefined,
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
        minHeight,
      }}
    >
      <div style={{ display: 'flex', alignItems, justifyContent: layout, padding, gap, ...innerStyle }}>
        {children || <span style={{ color: '#9ca3af', fontSize: '14px' }}>Header Row — drop elements here</span>}
      </div>
    </div>
  );
};

export const HeaderRowSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';
  const selectCls = 'w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Header Row Settings</h4>
      <p className="text-[11px] text-gray-500">
        Each row is a flex container. Drop elements like logos, search bars, icons, nav menus, or text into it.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Justify Content</label>
          <select value={props.layout || 'space-between'} onChange={(e) => setProp((p) => { p.layout = e.target.value; })} className={selectCls}>
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
            <option value="space-evenly">Space Evenly</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Align Items</label>
          <select value={props.alignItems || 'center'} onChange={(e) => setProp((p) => { p.alignItems = e.target.value; })} className={selectCls}>
            <option value="flex-start">Top</option>
            <option value="center">Center</option>
            <option value="flex-end">Bottom</option>
            <option value="stretch">Stretch</option>
            <option value="baseline">Baseline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Background</label>
          <div className="flex gap-1">
            <input type="color" value={props.backgroundColor || '#ffffff'} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })}
              className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={props.backgroundColor || ''} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })}
              className={inputCls} placeholder="transparent" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Text Color</label>
          <div className="flex gap-1">
            <input type="color" value={props.textColor || '#374151'} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })}
              className="w-9 h-9 border border-gray-300 rounded cursor-pointer" />
            <input type="text" value={props.textColor || ''} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })}
              className={inputCls} placeholder="inherit" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Padding</label>
          <input type="text" value={props.padding || '8px 0'} onChange={(e) => setProp((p) => { p.padding = e.target.value; })}
            className={inputCls} placeholder="8px 0" />
          <div className="flex gap-1 mt-1">
            {['4px 0', '8px 0', '12px 16px', '16px 24px', '20px 32px'].map(v => (
              <button key={v} type="button" onClick={() => setProp((p) => { p.padding = v; })}
                className={`flex-1 px-1 py-0.5 text-[9px] rounded border ${props.padding === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Gap</label>
          <input type="text" value={props.gap || '16px'} onChange={(e) => setProp((p) => { p.gap = e.target.value; })}
            className={inputCls} placeholder="16px" />
          <div className="flex gap-1 mt-1">
            {['0px', '8px', '16px', '24px', '32px'].map(v => (
              <button key={v} type="button" onClick={() => setProp((p) => { p.gap = v; })}
                className={`flex-1 px-1 py-0.5 text-[9px] rounded border ${props.gap === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Border Bottom</label>
        <input type="text" value={props.borderBottom || ''} onChange={(e) => setProp((p) => { p.borderBottom = e.target.value; })}
          className={inputCls} placeholder="1px solid #e5e7eb" />
        <div className="flex gap-1 mt-1">
          {['none', '1px solid #e5e7eb', '1px solid #d1d5db', '2px solid #3b82f6'].map(v => (
            <button key={v} type="button" onClick={() => setProp((p) => { p.borderBottom = v; })}
              className={`flex-1 px-1 py-0.5 text-[9px] rounded border ${props.borderBottom === v ? 'bg-blue-100 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {v === 'none' ? 'None' : v.includes('#e5e7eb') ? 'Light' : v.includes('#d1d5db') ? 'Medium' : 'Accent'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Min Height</label>
        <input type="text" value={props.minHeight || '40px'} onChange={(e) => setProp((p) => { p.minHeight = e.target.value; })}
          className={inputCls} placeholder="40px" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={props.fullWidth !== false} onChange={(e) => setProp((p) => { p.fullWidth = e.target.checked; })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <label className="text-xs text-gray-600">Full Width</label>
      </div>

      {!props.fullWidth && (
        <div>
          <label className={labelCls}>Container Max Width</label>
          <input type="text" value={props.containerMaxWidth || '1280px'} onChange={(e) => setProp((p) => { p.containerMaxWidth = e.target.value; })}
            className={inputCls} placeholder="1280px" />
        </div>
      )}
    </div>
  );
};

HeaderRow.craft = {
  displayName: 'Header Row',
  props: {
    layout: 'space-between', alignItems: 'center', backgroundColor: 'transparent',
    textColor: '', padding: '8px 0', gap: '16px', borderBottom: '',
    minHeight: '40px', fullWidth: true, containerMaxWidth: '1280px',
    className: '', style: {}, dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
  related: { settings: HeaderRowSettings },
};
