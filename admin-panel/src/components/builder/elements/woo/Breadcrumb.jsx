import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Breadcrumb = ({
  items = [
    { label: 'Home', url: '#' },
    { label: 'Shop', url: '#' },
    { label: 'Electronics', url: '#' },
    { label: 'Product Name', url: '' },
  ],
  separator = '/',
  fontSize = '13px',
  textColor = '#6b7280',
  activeColor = '#111827',
  linkColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <nav ref={(ref) => connect(drag(ref))} className={`breadcrumb ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize, flexWrap: 'wrap', ...style }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: textColor }}>{separator}</span>}
          {i === items.length - 1 || !item.url ? (
            <span style={{ color: activeColor, fontWeight: 500 }}>{item.label}</span>
          ) : (
            <a href={item.url} onClick={(e) => e.preventDefault()} style={{ color: linkColor, textDecoration: 'none' }}>{item.label}</a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export const BreadcrumbSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], separator = '/', fontSize = '13px', textColor = '#6b7280', linkColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Separator</label><input type="text" value={separator} onChange={(e) => setProp((p) => { p.separator = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Link Color</label><input type="color" value={linkColor} onChange={(e) => setProp((p) => { p.linkColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Items</h4><button onClick={() => setProp((p) => { p.items = [...(p.items||[]), { label: 'New', url: '#' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item.label} onChange={(e) => setProp((p) => { p.items[i].label = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Label" />
            <input type="text" value={item.url||''} onChange={(e) => setProp((p) => { p.items[i].url = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="URL" />
            <button onClick={() => setProp((p) => { p.items = p.items.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

Breadcrumb.craft = {
  displayName: 'Breadcrumb',
  props: { items: [{ label: 'Home', url: '#' }, { label: 'Shop', url: '#' }, { label: 'Electronics', url: '#' }, { label: 'Product Name', url: '' }], separator: '/', fontSize: '13px', textColor: '#6b7280', activeColor: '#111827', linkColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
