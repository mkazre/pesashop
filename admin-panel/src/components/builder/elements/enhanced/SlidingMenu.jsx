import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const SlidingMenu = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  items = [
    { label: 'Home', url: '#', icon: '🏠' },
    { label: 'About', url: '#', icon: '📄' },
    { label: 'Services', url: '#', icon: '⚙️' },
    { label: 'Portfolio', url: '#', icon: '🎨' },
    { label: 'Contact', url: '#', icon: '✉️' },
  ],
  triggerText = '☰ Menu',
  position = 'left',
  width = '280px',
  backgroundColor = '#1f2937',
  textColor = '#f3f4f6',
  accentColor = '#3b82f6',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`sliding-menu ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <button onClick={() => setIsOpen(true)} style={{ padding: '8px 16px', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>{triggerText}</button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'fixed', top: 0, bottom: 0, [position]: 0, width, backgroundColor, zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: textColor, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <nav style={{ flex: 1, padding: '0 16px' }}>
              {items.map((item, i) => (
                <a key={i} href={item.url || '#'} onClick={(e) => e.preventDefault()}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: textColor, textDecoration: 'none', fontSize: '15px', borderRadius: '8px', transition: 'background 0.2s', marginBottom: '2px' }}>
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export const SlidingMenuSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], triggerText = '', position = 'left', width = '280px', backgroundColor = '#1f2937', textColor = '#f3f4f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Settings</h4>
        <div><label className="block text-sm font-medium text-gray-700">Trigger Text</label><input type="text" value={triggerText} onChange={(e) => setProp((p) => { p.triggerText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Position</label><select value={position} onChange={(e) => setProp((p) => { p.position = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="left">Left</option><option value="right">Right</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700">Width</label><input type="text" value={width} onChange={(e) => setProp((p) => { p.width = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Items</h4><button onClick={() => setProp((p) => { p.items = [...(p.items||[]), { label: 'New Item', url: '#', icon: '📌' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex gap-2">
              <input type="text" value={item.icon||''} onChange={(e) => setProp((p) => { p.items[i].icon = e.target.value; })} className="w-10 px-1 py-1 border border-gray-300 rounded text-xs text-center" />
              <input type="text" value={item.label} onChange={(e) => setProp((p) => { p.items[i].label = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
              <button onClick={() => setProp((p) => { p.items = p.items.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
            </div>
            <input type="text" value={item.url||''} onChange={(e) => setProp((p) => { p.items[i].url = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="URL" />
          </div>
        ))}
      </div>
    </div>
  );
};

SlidingMenu.craft = {
  displayName: 'Sliding Menu',
  props: { items: [{ label: 'Home', url: '#', icon: '🏠' }, { label: 'About', url: '#', icon: '📄' }, { label: 'Services', url: '#', icon: '⚙️' }, { label: 'Portfolio', url: '#', icon: '🎨' }, { label: 'Contact', url: '#', icon: '✉️' }], triggerText: '☰ Menu', position: 'left', width: '280px', backgroundColor: '#1f2937', textColor: '#f3f4f6', accentColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
