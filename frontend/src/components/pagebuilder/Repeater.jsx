import React, { useState, useEffect, useMemo } from 'react';
import { productsAPI, categoriesAPI } from '@/services/api';
import { RepeaterItemProvider } from './RepeaterContext';

export const Repeater = ({
  dataSource = 'products',
  sourceFilter = 'all',
  categoryId = '',
  sortBy = 'createdAt',
  sortOrder = -1,
  limit = 8,
  columns = 4,
  gap = '16px',
  responsiveProps = {},
  children,
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
        let response;
        if (dataSource === 'products') {
          const params = { limit, sort: sortBy, order: sortOrder };
          if (sourceFilter === 'featured') params.featured = true;
          if (sourceFilter === 'new') params.sort = 'createdAt';
          if (sourceFilter === 'sale') params.onSale = true;
          if (sourceFilter === 'category' && categoryId) params.category = categoryId;
          response = await productsAPI.getAll(params);
        } else if (dataSource === 'categories') {
          response = await categoriesAPI.getAll();
        }
        if (!cancelled) {
          const list = response?.data?.data || response?.data || [];
          setItems(Array.isArray(list) ? list.slice(0, limit) : []);
        }
      } catch (err) {
        console.error('[Repeater] Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [queryKey]);

  // Strip non-CSS keys from style
  const { responsive, responsiveProps: _rp, badge, ...cleanStyle } = style || {};

  if (loading) {
    return (
      <div className={className} style={cleanStyle}>
        <div className="repeater-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
          {Array.from({ length: Math.min(limit, columns) }).map((_, i) => (
            <div key={i} style={{ background: '#f3f4f6', borderRadius: '8px', height: '200px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className={className} style={cleanStyle}>
      <div className="repeater-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {items.map((item) => (
          <RepeaterItemProvider key={item._id || item.id} value={item} dataSource={dataSource}>
            <div className="repeater-item" style={{ overflow: 'hidden', minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
          </RepeaterItemProvider>
        ))}
      </div>
    </div>
  );
};

Repeater.craft = { displayName: 'Repeater' };
