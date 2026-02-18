import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ProductMeta = ({
  sku = 'SKU-12345',
  categories = ['Electronics', 'Gadgets'],
  tags = ['New', 'Featured', 'Sale'],
  showSku = true,
  showCategories = true,
  showTags = true,
  labelColor = '#6b7280',
  valueColor = '#374151',
  fontSize = '13px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-meta ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize, ...style }}>
      {showSku && <div><span style={{ color: labelColor, fontWeight: 500 }}>SKU: </span><span style={{ color: valueColor }}>{sku}</span></div>}
      {showCategories && categories.length > 0 && <div><span style={{ color: labelColor, fontWeight: 500 }}>Categories: </span><span style={{ color: valueColor }}>{categories.join(', ')}</span></div>}
      {showTags && tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ color: labelColor, fontWeight: 500 }}>Tags: </span>
          {tags.map((t, i) => <span key={i} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: valueColor }}>{t}</span>)}
        </div>
      )}
    </div>
  );
};

export const ProductMetaSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { sku = '', showSku = true, showCategories = true, showTags = true, labelColor = '#6b7280', valueColor = '#374151' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Product Meta</h4>
        <div><label className="block text-sm font-medium text-gray-700">SKU</label><input type="text" value={sku} onChange={(e) => setProp((p) => { p.sku = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSku} onChange={(e) => setProp((p) => { p.showSku = e.target.checked; })} />Show SKU</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCategories} onChange={(e) => setProp((p) => { p.showCategories = e.target.checked; })} />Show Categories</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showTags} onChange={(e) => setProp((p) => { p.showTags = e.target.checked; })} />Show Tags</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Label Color</label><input type="color" value={labelColor} onChange={(e) => setProp((p) => { p.labelColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Value Color</label><input type="color" value={valueColor} onChange={(e) => setProp((p) => { p.valueColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

ProductMeta.craft = {
  displayName: 'Product Meta',
  props: { sku: 'SKU-12345', categories: ['Electronics', 'Gadgets'], tags: ['New', 'Featured', 'Sale'], showSku: true, showCategories: true, showTags: true, labelColor: '#6b7280', valueColor: '#374151', fontSize: '13px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
