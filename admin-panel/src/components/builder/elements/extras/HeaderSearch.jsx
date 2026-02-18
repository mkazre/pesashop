import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const HeaderSearch = ({
  placeholder = 'Search...',
  iconColor = '#6b7280',
  expandedWidth = '300px',
  backgroundColor = '#f3f4f6',
  borderRadius = '9999px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [expanded, setExpanded] = useState(false);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`header-search ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      {expanded ? (
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor, borderRadius, padding: '6px 14px', width: expandedWidth, transition: 'width 0.3s' }}>
          <span style={{ color: iconColor, marginRight: '8px', fontSize: '16px' }}>🔍</span>
          <input type="text" placeholder={placeholder} autoFocus onBlur={() => setExpanded(false)}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#374151' }} />
        </div>
      ) : (
        <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: iconColor, fontSize: '18px' }}>🔍</button>
      )}
    </div>
  );
};

export const HeaderSearchSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { placeholder = '', expandedWidth = '300px', backgroundColor = '#f3f4f6', iconColor = '#6b7280', borderRadius = '9999px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Header Search</h4>
        <div><label className="block text-sm font-medium text-gray-700">Placeholder</label><input type="text" value={placeholder} onChange={(e) => setProp((p) => { p.placeholder = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Expanded Width</label><input type="text" value={expandedWidth} onChange={(e) => setProp((p) => { p.expandedWidth = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Icon Color</label><input type="color" value={iconColor} onChange={(e) => setProp((p) => { p.iconColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

HeaderSearch.craft = {
  displayName: 'Header Search',
  props: { placeholder: 'Search...', iconColor: '#6b7280', expandedWidth: '300px', backgroundColor: '#f3f4f6', borderRadius: '9999px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
