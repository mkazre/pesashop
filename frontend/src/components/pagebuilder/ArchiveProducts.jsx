import React from 'react';

export const ArchiveProducts = ({
  columns = 3,
  gap = '20px',
  showPagination = true,
  products = [
    { name: 'Product 1', price: '$29.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P1' },
    { name: 'Product 2', price: '$39.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P2' },
    { name: 'Product 3', price: '$49.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P3' },
    { name: 'Product 4', price: '$59.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P4' },
    { name: 'Product 5', price: '$69.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P5' },
    { name: 'Product 6', price: '$79.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P6' },
  ],
  className = '',
  style = {},
}) => (
  <div className={className} style={style}>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
      {products.map((p, i) => (
        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>{p.price}</div>
            <button style={{ marginTop: '8px', width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Add to Cart</button>
          </div>
        </div>
      ))}
    </div>
    {showPagination && (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        {[1, 2, 3].map((n) => (
          <button key={n} style={{ width: '36px', height: '36px', borderRadius: '6px', border: n === 1 ? 'none' : '1px solid #d1d5db', backgroundColor: n === 1 ? '#3b82f6' : '#fff', color: n === 1 ? '#fff' : '#374151', cursor: 'pointer', fontSize: '14px' }}>{n}</button>
        ))}
      </div>
    )}
  </div>
);

ArchiveProducts.craft = { displayName: 'Archive Products' };
