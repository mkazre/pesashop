import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ProductStock = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  status = 'in-stock',
  quantity = 15,
  showQuantity = true,
  inStockText = 'In Stock',
  outOfStockText = 'Out of Stock',
  lowStockText = 'Low Stock',
  lowStockThreshold = 5,
  inStockColor = '#22c55e',
  outOfStockColor = '#ef4444',
  lowStockColor = '#f59e0b',
  fontSize = '14px',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const isLow = status === 'in-stock' && quantity <= lowStockThreshold;
  const color = status === 'out-of-stock' ? outOfStockColor : isLow ? lowStockColor : inStockColor;
  const text = status === 'out-of-stock' ? outOfStockText : isLow ? lowStockText : inStockText;

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-stock ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize, ...style }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <span style={{ color, fontWeight: 500 }}>{text}</span>
      {showQuantity && status !== 'out-of-stock' && <span style={{ color: '#6b7280' }}>({quantity} available)</span>}
    </div>
  );
};

export const ProductStockSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { status = 'in-stock', quantity = 15, showQuantity = true, lowStockThreshold = 5, inStockColor = '#22c55e', outOfStockColor = '#ef4444' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Stock</h4>
        <div><label className="block text-sm font-medium text-gray-700">Status</label><select value={status} onChange={(e) => setProp((p) => { p.status = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="in-stock">In Stock</option><option value="out-of-stock">Out of Stock</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Quantity</label><input type="number" value={quantity} onChange={(e) => setProp((p) => { p.quantity = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Low Threshold</label><input type="number" value={lowStockThreshold} onChange={(e) => setProp((p) => { p.lowStockThreshold = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showQuantity} onChange={(e) => setProp((p) => { p.showQuantity = e.target.checked; })} />Show Quantity</label>
      </div>
    </div>
  );
};

ProductStock.craft = {
  displayName: 'Product Stock',
  props: { status: 'in-stock', quantity: 15, showQuantity: true, inStockText: 'In Stock', outOfStockText: 'Out of Stock', lowStockText: 'Low Stock', lowStockThreshold: 5, inStockColor: '#22c55e', outOfStockColor: '#ef4444', lowStockColor: '#f59e0b', fontSize: '14px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
