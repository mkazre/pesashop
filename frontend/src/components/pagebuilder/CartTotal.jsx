import React from 'react';

export const CartTotal = ({
  subtotal = '$109.97',
  shipping = 'Free Shipping',
  total = '$109.97',
  showShipping = true,
  buttonText = 'Proceed to Checkout',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', maxWidth: '400px', ...style }}>
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

CartTotal.craft = { displayName: 'Cart Total' };
