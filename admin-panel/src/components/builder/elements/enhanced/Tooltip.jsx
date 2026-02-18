import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Tooltip = ({
  triggerText = 'Hover me',
  tooltipText = 'This is a tooltip',
  position = 'top',
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  fontSize = '13px',
  maxWidth = '200px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [show, setShow] = useState(false);

  const posStyles = { top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }, bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }, left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' }, right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' } };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`tooltip-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ position: 'relative', display: 'inline-block', ...style }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ cursor: 'pointer', borderBottom: '1px dashed #9ca3af' }}>{triggerText}</span>
      {show && (
        <div style={{ position: 'absolute', ...posStyles[position], backgroundColor, color: textColor, fontSize, padding: '8px 12px', borderRadius: '6px', maxWidth, whiteSpace: 'normal', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', pointerEvents: 'none' }}>
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export const TooltipSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { triggerText = '', tooltipText = '', position = 'top', backgroundColor = '#1f2937', textColor = '#ffffff', fontSize = '13px', maxWidth = '200px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Trigger Text</label><input type="text" value={triggerText} onChange={(e) => setProp((p) => { p.triggerText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Tooltip Text</label><textarea value={tooltipText} onChange={(e) => setProp((p) => { p.tooltipText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={2} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Position</label><select value={position} onChange={(e) => setProp((p) => { p.position = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

Tooltip.craft = {
  displayName: 'Tooltip',
  props: { triggerText: 'Hover me', tooltipText: 'This is a tooltip', position: 'top', backgroundColor: '#1f2937', textColor: '#ffffff', fontSize: '13px', maxWidth: '200px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
