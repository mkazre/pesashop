import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ShoppingCartPage = ({
  items = [
    { name: 'Product 1', price: '$29.99', qty: 2, image: 'https://placehold.co/80x80/e2e8f0/64748b?text=P1' },
    { name: 'Product 2', price: '$49.99', qty: 1, image: 'https://placehold.co/80x80/e2e8f0/64748b?text=P2' },
  ],
  showCoupon = true,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {['', 'Product', 'Price', 'Qty', 'Total', ''].map((h, i) => (
              <th key={i} style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 8px' }}><img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} /></td>
              <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 500 }}>{item.name}</td>
              <td style={{ padding: '12px 8px', fontSize: '14px' }}>{item.price}</td>
              <td style={{ padding: '12px 8px' }}><input type="number" value={item.qty} readOnly style={{ width: '50px', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center' }} /></td>
              <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 600 }}>${(parseFloat(item.price.replace('$', '')) * item.qty).toFixed(2)}</td>
              <td style={{ padding: '12px 8px', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showCoupon && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input type="text" placeholder="Coupon code" style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', flex: 1 }} />
          <button style={{ padding: '10px 20px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Apply Coupon</button>
        </div>
      )}
      <button style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Update Cart</button>
    </div>
  );
};

export const ShoppingCartPageSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={props.showCoupon !== false} onChange={(e) => setProp((p) => { p.showCoupon = e.target.checked; })} /> Show Coupon Field
      </label>
    </div>
  );
};

ShoppingCartPage.craft = {
  displayName: 'Shopping Cart Page',
  props: { items: [{ name: 'Product 1', price: '$29.99', qty: 2, image: 'https://placehold.co/80x80/e2e8f0/64748b?text=P1' }, { name: 'Product 2', price: '$49.99', qty: 1, image: 'https://placehold.co/80x80/e2e8f0/64748b?text=P2' }], showCoupon: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ShoppingCartPageSettings },
};
