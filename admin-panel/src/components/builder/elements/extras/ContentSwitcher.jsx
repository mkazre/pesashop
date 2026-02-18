import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ContentSwitcher = ({
  labelA = 'Monthly',
  labelB = 'Yearly',
  contentA = 'Monthly pricing content goes here.',
  contentB = 'Yearly pricing content goes here. Save 20%!',
  activeColor = '#3b82f6',
  inactiveColor = '#e5e7eb',
  textColor = '#374151',
  fontSize = '14px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [isB, setIsB] = useState(false);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`content-switcher ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{ fontSize: '14px', fontWeight: !isB ? 600 : 400, color: !isB ? activeColor : '#6b7280' }}>{labelA}</span>
        <button onClick={() => setIsB(!isB)} style={{ width: '48px', height: '26px', borderRadius: '13px', backgroundColor: isB ? activeColor : inactiveColor, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', left: isB ? '24px' : '2px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: isB ? 600 : 400, color: isB ? activeColor : '#6b7280' }}>{labelB}</span>
      </div>
      <div style={{ fontSize, color: textColor, lineHeight: 1.6 }}>{isB ? contentB : contentA}</div>
    </div>
  );
};

export const ContentSwitcherSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { labelA = '', labelB = '', contentA = '', contentB = '', activeColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Labels</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Label A</label><input type="text" value={labelA} onChange={(e) => setProp((p) => { p.labelA = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Label B</label><input type="text" value={labelB} onChange={(e) => setProp((p) => { p.labelB = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Content A</label><textarea value={contentA} onChange={(e) => setProp((p) => { p.contentA = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Content B</label><textarea value={contentB} onChange={(e) => setProp((p) => { p.contentB = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700">Active Color</label><input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
    </div>
  );
};

ContentSwitcher.craft = {
  displayName: 'Content Switcher',
  props: { labelA: 'Monthly', labelB: 'Yearly', contentA: 'Monthly pricing content goes here.', contentB: 'Yearly pricing content goes here. Save 20%!', activeColor: '#3b82f6', inactiveColor: '#e5e7eb', textColor: '#374151', fontSize: '14px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
