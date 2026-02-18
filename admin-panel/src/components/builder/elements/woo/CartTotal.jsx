import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const CartTotal = ({
  subtotal = '$109.97',
  shipping = 'Free Shipping',
  total = '$109.97',
  showShipping = true,
  buttonText = 'Proceed to Checkout',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', maxWidth: '400px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Cart Totals</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
        <span>Subtotal</span><span>{subtotal}</span>
      </div>
      {showShipping && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
          <span>Shipping</span><span>{shipping}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '16px', fontWeight: 700 }}>
        <span>Total</span><span>{total}</span>
      </div>
      <button style={{ width: '100%', padding: '14px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}>{buttonText}</button>
    </div>
  );
};

export const CartTotalSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'subtotal', label: 'Subtotal' }, { key: 'shipping', label: 'Shipping' }, { key: 'total', label: 'Total' }, { key: 'buttonText', label: 'Button Text' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="text" value={props[key] || ''} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ))}
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Button Color</label>
      <input type="color" value={props.buttonColor || '#3b82f6'} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

CartTotal.craft = {
  displayName: 'Cart Total',
  props: { subtotal: '$109.97', shipping: 'Free Shipping', total: '$109.97', showShipping: true, buttonText: 'Proceed to Checkout', buttonColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: CartTotalSettings },
};
