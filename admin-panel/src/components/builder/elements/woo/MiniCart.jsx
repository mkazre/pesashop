import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const MiniCart = ({
  items = [
    { name: 'Product One', price: '$29.99', qty: 1, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P1' },
    { name: 'Product Two', price: '$49.99', qty: 2, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P2' },
  ],
  subtotal = '$129.97',
  buttonText = 'View Cart',
  checkoutText = 'Checkout',
  accentColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`mini-cart ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', maxWidth: '320px', ...style }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>Shopping Cart ({items.length})</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.qty} × {item.price}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Subtotal</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{subtotal}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{ flex: 1, padding: '10px', border: `1px solid ${accentColor}`, borderRadius: '6px', backgroundColor: 'transparent', color: accentColor, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>{buttonText}</button>
        <button style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', backgroundColor: accentColor, color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>{checkoutText}</button>
      </div>
    </div>
  );
};

export const MiniCartSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { subtotal = '', buttonText = '', checkoutText = '', accentColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Mini Cart</h4>
        <div><label className="block text-sm font-medium text-gray-700">Subtotal</label><input type="text" value={subtotal} onChange={(e) => setProp((p) => { p.subtotal = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Cart Button</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Checkout Button</label><input type="text" value={checkoutText} onChange={(e) => setProp((p) => { p.checkoutText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Accent Color</label><input type="color" value={accentColor} onChange={(e) => setProp((p) => { p.accentColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

MiniCart.craft = {
  displayName: 'Mini Cart',
  props: { items: [{ name: 'Product One', price: '$29.99', qty: 1, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P1' }, { name: 'Product Two', price: '$49.99', qty: 2, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P2' }], subtotal: '$129.97', buttonText: 'View Cart', checkoutText: 'Checkout', accentColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
