import React, { useState, useEffect } from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const defaultProducts = [
  { name: 'Premium Version', price: '$79.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Up1' },
  { name: 'Deluxe Bundle', price: '$99.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Up2' },
];

export const ProductUpsells = ({
  title = 'You may also like',
  products = defaultProducts,
  columns = 4,
  gap = '16px',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (!product?._id) { setFetched(null); return; }
    const categoryId = product.categories?.[0]?._id || product.categories?.[0];
    if (!categoryId) { setFetched(null); return; }
    let cancelled = false;
    fetch(`${API_URL}/api/products?category=${categoryId}&limit=8&sort=-rating`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const items = (data?.data || []).filter(p => p._id !== product._id).slice(0, parseInt(columns) || 4);
        setFetched(items.length > 0 ? items : null);
      })
      .catch(() => { if (!cancelled) setFetched(null); });
    return () => { cancelled = true; };
  }, [product?._id, columns]);

  const displayProducts = fetched
    ? fetched.map(p => ({
        name: p.name,
        price: `R ${(p.salePrice || p.regularPrice || 0).toFixed(2)}`,
        image: (() => { const img = p.featuredImage || p.images?.[0]; return img ? (img.startsWith('/uploads/') ? `${API_URL}${img}` : img) : 'https://placehold.co/200x200/e2e8f0/64748b?text=Up'; })(),
        slug: p.slug,
      }))
    : products;

  return (
    <div className={className} style={style}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {displayProducts.map((p, i) => (
          <a key={i} href={p.slug ? `/product/${p.slug}` : '#'} style={{ textDecoration: 'none', color: 'inherit', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'block' }}>
            <img src={p.image} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{p.price}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

ProductUpsells.craft = { displayName: 'Product Upsells' };
