import React from 'react';

export const ProductRelated = ({
  title = 'Related Products',
  products = [
    { name: 'Related Product 1', price: '$29.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P1' },
    { name: 'Related Product 2', price: '$39.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P2' },
    { name: 'Related Product 3', price: '$49.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P3' },
    { name: 'Related Product 4', price: '$59.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P4' },
  ],
  columns = 4,
  gap = '16px',
  className = '',
  style = {},
}) => (
  <div className={className} style={style}>
    <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
      {products.map((p, i) => (
        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{p.price}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

ProductRelated.craft = { displayName: 'Product Related' };
