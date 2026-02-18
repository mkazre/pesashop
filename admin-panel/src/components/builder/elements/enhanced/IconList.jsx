import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const IconList = ({
  items = [
    { icon: '✓', text: 'Feature one included', color: '#22c55e' },
    { icon: '✓', text: 'Feature two included', color: '#22c55e' },
    { icon: '✓', text: 'Feature three included', color: '#22c55e' },
    { icon: '✗', text: 'Feature not included', color: '#ef4444' },
  ],
  iconSize = '18px',
  textSize = '14px',
  textColor = '#374151',
  gap = '12px',
  layout = 'vertical',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`icon-list ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: layout === 'horizontal' ? 'row' : 'column', gap, flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: iconSize, color: item.color || '#3b82f6', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: textSize, color: textColor }}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const IconListSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], iconSize = '18px', textSize = '14px', textColor = '#374151', gap = '12px', layout = 'vertical' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Layout</label><select value={layout} onChange={(e) => setProp((p) => { p.layout = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Icon Size</label><input type="text" value={iconSize} onChange={(e) => setProp((p) => { p.iconSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Items</h4><button onClick={() => setProp((p) => { p.items = [...(p.items || []), { icon: '✓', text: 'New item', color: '#22c55e' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex gap-2">
              <input type="text" value={item.icon} onChange={(e) => setProp((p) => { p.items[i].icon = e.target.value; })} className="w-12 px-2 py-1 border border-gray-300 rounded text-xs text-center" />
              <input type="text" value={item.text} onChange={(e) => setProp((p) => { p.items[i].text = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
              <input type="color" value={item.color || '#22c55e'} onChange={(e) => setProp((p) => { p.items[i].color = e.target.value; })} className="w-8 h-6 border border-gray-300 rounded" />
              <button onClick={() => setProp((p) => { p.items = p.items.filter((_, idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

IconList.craft = {
  displayName: 'Icon List',
  props: { items: [{ icon: '✓', text: 'Feature one included', color: '#22c55e' }, { icon: '✓', text: 'Feature two included', color: '#22c55e' }, { icon: '✓', text: 'Feature three included', color: '#22c55e' }, { icon: '✗', text: 'Feature not included', color: '#ef4444' }], iconSize: '18px', textSize: '14px', textColor: '#374151', gap: '12px', layout: 'vertical', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
