import React from 'react';

export const MiniCart = ({
  items = [
    { name: 'Product One', price: '$29.99', qty: 1, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P1' },
    { name: 'Product Two', price: '$49.99', qty: 2, image: 'https://placehold.co/60x60/e2e8f0/64748b?text=P2' },
  ],
  subtotal = '$129.97',
  checkoutUrl = '/checkout',
  cartUrl = '/cart',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '320px', ...style }}>
    {items.length === 0 ? (
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', margin: '16px 0' }}>Your cart is empty</p>
    ) : (
      <>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.qty} × {item.price}</div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 8px', fontWeight: 600, fontSize: '14px' }}>
          <span>Subtotal:</span><span>{subtotal}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <a href={cartUrl} style={{ flex: 1, padding: '8px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '6px', textDecoration: 'none', color: '#374151', fontSize: '13px', fontWeight: 500 }}>View Cart</a>
          <a href={checkoutUrl} style={{ flex: 1, padding: '8px', textAlign: 'center', backgroundColor: '#3b82f6', borderRadius: '6px', textDecoration: 'none', color: '#fff', fontSize: '13px', fontWeight: 500 }}>Checkout</a>
        </div>
      </>
    )}
  </div>
);

MiniCart.craft = { displayName: 'Mini Cart' };
