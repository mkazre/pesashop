import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ToggleSwitch = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  label = 'Enable Feature',
  defaultChecked = false,
  activeColor = '#3b82f6',
  inactiveColor = '#d1d5db',
  size = 'medium',
  labelPosition = 'left',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [checked, setChecked] = useState(defaultChecked);
  const sizes = { small: { w: 36, h: 20, dot: 16 }, medium: { w: 48, h: 26, dot: 22 }, large: { w: 60, h: 32, dot: 28 } };
  const s = sizes[size] || sizes.medium;

  return (
    <div ref={(ref) => connect(drag(ref))} className={`toggle-switch ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: labelPosition === 'right' ? 'row-reverse' : 'row', ...style }}>
      {label && <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>}
      <button onClick={() => setChecked(!checked)} style={{ width: s.w, height: s.h, borderRadius: s.h, backgroundColor: checked ? activeColor : inactiveColor, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
        <div style={{ width: s.dot, height: s.dot, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: (s.h - s.dot) / 2, left: checked ? s.w - s.dot - (s.h - s.dot) / 2 : (s.h - s.dot) / 2, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
};

export const ToggleSwitchSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { label = '', defaultChecked = false, activeColor = '#3b82f6', size = 'medium', labelPosition = 'left' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Toggle Switch</h4>
        <div><label className="block text-sm font-medium text-gray-700">Label</label><input type="text" value={label} onChange={(e) => setProp((p) => { p.label = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Size</label><select value={size} onChange={(e) => setProp((p) => { p.size = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700">Label Position</label><select value={labelPosition} onChange={(e) => setProp((p) => { p.labelPosition = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="left">Left</option><option value="right">Right</option></select></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={defaultChecked} onChange={(e) => setProp((p) => { p.defaultChecked = e.target.checked; })} />Default On</label>
        <div><label className="block text-sm font-medium text-gray-700">Active Color</label><input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

ToggleSwitch.craft = {
  displayName: 'Toggle Switch',
  props: { label: 'Enable Feature', defaultChecked: false, activeColor: '#3b82f6', inactiveColor: '#d1d5db', size: 'medium', labelPosition: 'left', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
