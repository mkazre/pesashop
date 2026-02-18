import React, { useState, useEffect, useMemo } from 'react';
import { productsAPI } from '@/services/api';
import { Link } from 'react-router-dom';

export const ProductGrid = ({
  dataSource = 'products',
  sourceFilter = 'all',
  categoryId = '',
  sortBy = 'createdAt',
  sortOrder = -1,
  limit = 12,
  columns = 3,
  gap = '16px',
  showImage = true,
  showTitle = true,
  showPrice = true,
  showButton = true,
  className = '',
  style = {},
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const queryKey = useMemo(
    () => JSON.stringify({ dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit }),
    [dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit]
  );

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { limit, sort: sortBy, order: sortOrder };
        if (sourceFilter === 'featured') params.featured = true;
        if (sourceFilter === 'new') params.sort = 'createdAt';
        if (sourceFilter === 'sale') params.onSale = true;
        if (sourceFilter === 'category' && categoryId) params.category = categoryId;
        const response = await productsAPI.getAll(params);
        if (!cancelled) {
          const list = response?.data?.data || response?.data || [];
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('[ProductGrid] Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [queryKey]);

  if (loading) {
    return (
      <div className={className} style={style}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} style={{ background: '#f3f4f6', borderRadius: '8px', height: '280px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className={className} style={style}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {items.map((product) => {
          const imageUrl = product.featuredImage || product.images?.[0] || '';
          const price = product.salePrice || product.regularPrice || 0;
          const hasSale = product.salePrice && product.salePrice < product.regularPrice;
          return (
            <div key={product._id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              {showImage && (
                <Link to={`/product/${product.slug || product._id}`}>
                  <div style={{ aspectRatio: '1', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>No Image</div>
                    )}
                    {hasSale && (
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>SALE</span>
                    )}
                  </div>
                </Link>
              )}
              <div style={{ padding: '12px' }}>
                {showTitle && (
                  <Link to={`/product/${product.slug || product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</h3>
                  </Link>
                )}
                {showPrice && (
                  <div style={{ marginBottom: '8px' }}>
                    {hasSale ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#ef4444' }}>R {product.salePrice.toFixed(2)}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>R {product.regularPrice.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>R {price.toFixed(2)}</span>
                    )}
                  </div>
                )}
                {showButton && (
                  <button style={{ width: '100%', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ProductGrid.craft = { displayName: 'ProductGrid' };
