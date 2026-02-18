import React from 'react';

export const ArchiveCategories = ({
  categories = [
    { name: 'Electronics', count: 24, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Elec' },
    { name: 'Clothing', count: 18, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Cloth' },
    { name: 'Home & Garden', count: 32, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Home' },
    { name: 'Sports', count: 15, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Sport' },
  ],
  columns = 4,
  gap = '16px',
  showCount = true,
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap, ...style }}>
    {categories.map((cat, i) => (
      <a key={i} href="#" style={{ textDecoration: 'none', color: 'inherit', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'block' }}>
        <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{cat.name}</div>
          {showCount && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{cat.count} products</div>}
        </div>
      </a>
    ))}
  </div>
);

ArchiveCategories.craft = { displayName: 'Archive Categories' };
