import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const OffCanvas = ({
  triggerText = 'Open Panel',
  title = 'Panel Title',
  content = 'Panel content goes here.',
  position = 'right',
  width = '320px',
  overlayColor = 'rgba(0,0,0,0.5)',
  backgroundColor = '#ffffff',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [isOpen, setIsOpen] = useState(false);

  const panelStyle = {
    position: 'fixed', top: 0, bottom: 0, width, backgroundColor, zIndex: 9999,
    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', transition: 'transform 0.3s ease',
    display: 'flex', flexDirection: 'column',
    ...(position === 'right' ? { right: 0 } : { left: 0 }),
  };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`off-canvas ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <button onClick={() => setIsOpen(true)} style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>{triggerText}</button>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: overlayColor, zIndex: 9998 }} onClick={() => setIsOpen(false)} />
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: '20px', overflow: 'auto', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{content}</div>
          </div>
        </>
      )}
    </div>
  );
};

export const OffCanvasSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { triggerText = '', title = '', content = '', position = 'right', width = '320px', backgroundColor = '#ffffff' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Trigger Text</label><input type="text" value={triggerText} onChange={(e) => setProp((p) => { p.triggerText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Panel Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Content</label><textarea value={content} onChange={(e) => setProp((p) => { p.content = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={4} /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Position</label><select value={position} onChange={(e) => setProp((p) => { p.position = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="right">Right</option><option value="left">Left</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700">Width</label><input type="text" value={width} onChange={(e) => setProp((p) => { p.width = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

OffCanvas.craft = {
  displayName: 'Off Canvas',
  props: { triggerText: 'Open Panel', title: 'Panel Title', content: 'Panel content goes here.', position: 'right', width: '320px', overlayColor: 'rgba(0,0,0,0.5)', backgroundColor: '#ffffff', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
