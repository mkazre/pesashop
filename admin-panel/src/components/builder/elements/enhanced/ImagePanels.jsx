import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ImagePanels = ({
  panels = [
    { src: 'https://placehold.co/400x600/3b82f6/ffffff?text=Panel+1', title: 'Panel 1' },
    { src: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Panel+2', title: 'Panel 2' },
    { src: 'https://placehold.co/400x600/ec4899/ffffff?text=Panel+3', title: 'Panel 3' },
    { src: 'https://placehold.co/400x600/f59e0b/ffffff?text=Panel+4', title: 'Panel 4' },
  ],
  height = '400px',
  gap = '4px',
  textColor = '#ffffff',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`image-panels ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', height, gap, overflow: 'hidden', borderRadius: '8px', ...style }}>
      {panels.map((panel, i) => (
        <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'flex 0.4s ease' }}
          className="hover:!flex-[3]">
          <img src={panel.src} alt={panel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
            <span style={{ color: textColor, fontSize: '14px', fontWeight: 600 }}>{panel.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ImagePanelsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { panels = [], height = '400px', gap = '4px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Panels</h4><button onClick={() => setProp((p) => { p.panels = [...(p.panels||[]), { src: 'https://placehold.co/400x600/64748b/ffffff?text=New', title: 'New Panel' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {panels.map((panel, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Panel {i+1}</span><button onClick={() => setProp((p) => { p.panels = p.panels.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">Remove</button></div>
            <input type="text" value={panel.title} onChange={(e) => setProp((p) => { p.panels[i].title = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Title" />
            <input type="text" value={panel.src} onChange={(e) => setProp((p) => { p.panels[i].src = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Image URL" />
          </div>
        ))}
      </div>
    </div>
  );
};

ImagePanels.craft = {
  displayName: 'Image Panels',
  props: { panels: [{ src: 'https://placehold.co/400x600/3b82f6/ffffff?text=Panel+1', title: 'Panel 1' }, { src: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Panel+2', title: 'Panel 2' }, { src: 'https://placehold.co/400x600/ec4899/ffffff?text=Panel+3', title: 'Panel 3' }, { src: 'https://placehold.co/400x600/f59e0b/ffffff?text=Panel+4', title: 'Panel 4' }], height: '400px', gap: '4px', textColor: '#ffffff', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
