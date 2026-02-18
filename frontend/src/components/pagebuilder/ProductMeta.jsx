import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductMeta = ({
  sku = 'SKU-12345',
  categories = ['Electronics', 'Gadgets'],
  tags = ['New', 'Featured', 'Sale'],
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;

  const displaySku = product?.sku || sku;
  const displayCategories = product?.categories
    ? (Array.isArray(product.categories) ? product.categories : []).map(c => typeof c === 'string' ? c : c.name).filter(Boolean)
    : categories;
  const displayTags = product?.tags?.length > 0 ? product.tags : tags;

  return (
    <div className={className} style={{ fontSize: '13px', color: '#6b7280', lineHeight: 2, ...style }}>
      {displaySku && <div><span style={{ fontWeight: 500, color: '#374151' }}>SKU:</span> {displaySku}</div>}
      {displayCategories.length > 0 && <div><span style={{ fontWeight: 500, color: '#374151' }}>Categories:</span> {displayCategories.join(', ')}</div>}
      {displayTags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span style={{ fontWeight: 500, color: '#374151' }}>Tags:</span>
          {displayTags.map((tag, i) => (
            <span key={i} style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

ProductMeta.craft = { displayName: 'Product Meta' };
