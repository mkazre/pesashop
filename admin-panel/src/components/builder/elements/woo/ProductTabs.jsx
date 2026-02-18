import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ProductTabs = ({
  tabs = [
    { label: 'Description', content: 'Full product description goes here with all the details about the product.' },
    { label: 'Additional Info', content: 'Weight: 1.5kg\nDimensions: 30 × 20 × 10 cm\nMaterial: Premium Cotton' },
    { label: 'Reviews', content: 'Customer reviews will be displayed here.' },
  ],
  activeColor = '#3b82f6',
  borderColor = '#e5e7eb',
  textColor = '#374151',
  fontSize = '14px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [active, setActive] = useState(0);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-tabs ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ display: 'flex', borderBottom: `2px solid ${borderColor}` }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '12px 20px', fontSize, fontWeight: i === active ? 600 : 400, color: i === active ? activeColor : '#6b7280', borderBottom: i === active ? `2px solid ${activeColor}` : '2px solid transparent', marginBottom: '-2px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '20px 0', fontSize, color: textColor, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {tabs[active]?.content}
      </div>
    </div>
  );
};

export const ProductTabsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { tabs = [], activeColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Active Color</label><input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Tabs</h4><button onClick={() => setProp((p) => { p.tabs = [...(p.tabs||[]), { label: 'New Tab', content: 'Tab content here.' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {tabs.map((tab, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex justify-between"><input type="text" value={tab.label} onChange={(e) => setProp((p) => { p.tabs[i].label = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-medium" /><button onClick={() => setProp((p) => { p.tabs = p.tabs.filter((_,idx) => idx !== i); })} className="text-xs text-red-500 ml-2">✕</button></div>
            <textarea value={tab.content} onChange={(e) => setProp((p) => { p.tabs[i].content = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
};

ProductTabs.craft = {
  displayName: 'Product Tabs',
  props: { tabs: [{ label: 'Description', content: 'Full product description goes here.' }, { label: 'Additional Info', content: 'Weight: 1.5kg\nDimensions: 30 × 20 × 10 cm' }, { label: 'Reviews', content: 'Customer reviews will be displayed here.' }], activeColor: '#3b82f6', borderColor: '#e5e7eb', textColor: '#374151', fontSize: '14px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
