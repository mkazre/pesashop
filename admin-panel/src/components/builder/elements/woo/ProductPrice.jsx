import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useRepeaterItem } from '@/components/builder/utils/RepeaterContext';

export const ProductPrice = ({
  price = '$49.99',
  salePrice = '$39.99',
  showSale = true,
  priceColor = '#111827',
  salePriceColor = '#ef4444',
  originalPriceColor = '#9ca3af',
  fontSize = '24px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const repeaterItem = useRepeaterItem();

  // Use real product data from Repeater context if available
  const displayPrice = repeaterItem ? `R ${(repeaterItem.regularPrice || 0).toFixed(2)}` : price;
  const displaySalePrice = repeaterItem?.salePrice ? `R ${repeaterItem.salePrice.toFixed(2)}` : salePrice;
  const hasSale = repeaterItem ? (repeaterItem.salePrice && repeaterItem.salePrice < repeaterItem.regularPrice) : (showSale && salePrice);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-price ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'baseline', gap: '8px', ...style }}>
      {hasSale ? (
        <>
          <span style={{ fontSize, fontWeight: 700, color: salePriceColor }}>{displaySalePrice}</span>
          <span style={{ fontSize: `calc(${fontSize} * 0.7)`, color: originalPriceColor, textDecoration: 'line-through' }}>{displayPrice}</span>
        </>
      ) : (
        <span style={{ fontSize, fontWeight: 700, color: priceColor }}>{displayPrice}</span>
      )}
    </div>
  );
};

export const ProductPriceSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { price = '', salePrice = '', showSale = true, priceColor = '#111827', salePriceColor = '#ef4444', fontSize = '24px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Price</h4>
        <div><label className="block text-sm font-medium text-gray-700">Regular Price</label><input type="text" value={price} onChange={(e) => setProp((p) => { p.price = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSale} onChange={(e) => setProp((p) => { p.showSale = e.target.checked; })} />Show Sale Price</label>
        {showSale && <div><label className="block text-sm font-medium text-gray-700">Sale Price</label><input type="text" value={salePrice} onChange={(e) => setProp((p) => { p.salePrice = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>}
        <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Price Color</label><input type="color" value={priceColor} onChange={(e) => setProp((p) => { p.priceColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Sale Color</label><input type="color" value={salePriceColor} onChange={(e) => setProp((p) => { p.salePriceColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

ProductPrice.craft = {
  displayName: 'Product Price',
  props: { price: '$49.99', salePrice: '$39.99', showSale: true, priceColor: '#111827', salePriceColor: '#ef4444', originalPriceColor: '#9ca3af', fontSize: '24px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
