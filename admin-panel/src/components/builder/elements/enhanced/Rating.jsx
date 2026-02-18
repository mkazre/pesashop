import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Rating = ({
  value = 4,
  max = 5,
  size = '24px',
  activeColor = '#fbbf24',
  inactiveColor = '#d1d5db',
  showValue = true,
  label = '',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`rating-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      {label && <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{label}</span>}
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} style={{ fontSize: size, color: i < value ? activeColor : inactiveColor, lineHeight: 1 }}>★</span>
        ))}
      </div>
      {showValue && <span style={{ fontSize: '14px', color: '#6b7280' }}>{value}/{max}</span>}
    </div>
  );
};

export const RatingSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { value = 4, max = 5, size = '24px', activeColor = '#fbbf24', inactiveColor = '#d1d5db', showValue = true, label = '' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Rating</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Value</label><input type="number" min={0} max={max} value={value} onChange={(e) => setProp((p) => { p.value = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Max</label><input type="number" min={1} max={10} value={max} onChange={(e) => setProp((p) => { p.max = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Label</label><input type="text" value={label} onChange={(e) => setProp((p) => { p.label = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showValue} onChange={(e) => setProp((p) => { p.showValue = e.target.checked; })} />Show Value</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Star Size</label><input type="text" value={size} onChange={(e) => setProp((p) => { p.size = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Active</label><input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Inactive</label><input type="color" value={inactiveColor} onChange={(e) => setProp((p) => { p.inactiveColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

Rating.craft = {
  displayName: 'Rating',
  props: { value: 4, max: 5, size: '24px', activeColor: '#fbbf24', inactiveColor: '#d1d5db', showValue: true, label: '', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
