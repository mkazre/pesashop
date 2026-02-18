import React, { useMemo } from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const Breadcrumb = ({
  items = [
    { label: 'Home', url: '#' },
    { label: 'Shop', url: '#' },
    { label: 'Product', url: '' },
  ],
  separator = '/',
  fontSize = '14px',
  color = '#6b7280',
  activeColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;

  const displayItems = useMemo(() => {
    if (!product) return items;
    const crumbs = [{ label: 'Home', url: '/' }, { label: 'Shop', url: '/shop' }];
    const cat = product.categories?.[0];
    if (cat) {
      const catName = typeof cat === 'string' ? cat : cat.name;
      const catSlug = typeof cat === 'string' ? cat : cat.slug;
      if (catName) crumbs.push({ label: catName, url: `/shop?category=${catSlug || ''}` });
    }
    crumbs.push({ label: product.name || 'Product', url: '' });
    return crumbs;
  }, [product, items]);

  return (
    <nav className={className} style={{ fontSize, ...style }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
        {displayItems.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <span style={{ color }}>{separator}</span>}
            {item.url ? (
              <a href={item.url} style={{ color: activeColor, textDecoration: 'none' }}
                onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}>
                {item.label}
              </a>
            ) : (
              <span style={{ color, fontWeight: 500 }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

Breadcrumb.craft = { displayName: 'Breadcrumb' };
