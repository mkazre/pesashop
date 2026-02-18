import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductStock = ({
  status = 'in-stock',
  quantity = 15,
  showQuantity = true,
  lowStockThreshold = 5,
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;

  const displayQuantity = product?.stock ?? quantity;
  const displayThreshold = product?.lowStockThreshold ?? lowStockThreshold;
  const displayStatus = product
    ? (displayQuantity <= 0 ? 'out-of-stock' : displayQuantity <= displayThreshold ? 'low-stock' : 'in-stock')
    : status;

  const statusConfig = {
    'in-stock': { color: '#22c55e', bg: '#f0fdf4', text: 'In Stock', icon: '✓' },
    'low-stock': { color: '#f59e0b', bg: '#fffbeb', text: 'Low Stock', icon: '⚠' },
    'out-of-stock': { color: '#ef4444', bg: '#fef2f2', text: 'Out of Stock', icon: '✕' },
  };
  const effectiveStatus = displayStatus === 'in-stock' && displayQuantity <= displayThreshold ? 'low-stock' : displayStatus;
  const config = statusConfig[effectiveStatus] || statusConfig['in-stock'];

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: config.bg, borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: config.color, ...style }}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
      {showQuantity && effectiveStatus !== 'out-of-stock' && <span style={{ color: '#6b7280' }}>({displayQuantity} available)</span>}
    </div>
  );
};

ProductStock.craft = { displayName: 'Product Stock' };
