import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const CopyrightYear = ({
  text = '© {year} Your Company. All rights reserved.',
  fontSize = '14px',
  textColor = '#6b7280',
  textAlign = 'center',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const displayText = text.replace('{year}', new Date().getFullYear());

  return (
    <div ref={(ref) => connect(drag(ref))} className={`copyright-year ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ fontSize, color: textColor, textAlign, ...style }}>
      {displayText}
    </div>
  );
};

export const CopyrightYearSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { text = '', fontSize = '14px', textColor = '#6b7280', textAlign = 'center' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Copyright</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text (use {'{year}'} for current year)</label><input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Align</label><select value={textAlign} onChange={(e) => setProp((p) => { p.textAlign = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

CopyrightYear.craft = {
  displayName: 'Copyright Year',
  props: { text: '© {year} Your Company. All rights reserved.', fontSize: '14px', textColor: '#6b7280', textAlign: 'center', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
