import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductRating = ({
  rating = 4.5,
  reviewCount = 128,
  showCount = true,
  starColor = '#fbbf24',
  emptyColor = '#d1d5db',
  size = '18px',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const displayRating = product?.rating ?? rating;
  const displayCount = product?.reviewCount ?? product?.numReviews ?? reviewCount;
  const fullStars = Math.floor(displayRating);
  const hasHalf = displayRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '6px', ...style }}>
      <div style={{ display: 'flex', gap: '1px', fontSize: size }}>
        {Array(fullStars).fill(null).map((_, i) => <span key={`f${i}`} style={{ color: starColor }}>★</span>)}
        {hasHalf && <span style={{ color: starColor }}>★</span>}
        {Array(emptyStars).fill(null).map((_, i) => <span key={`e${i}`} style={{ color: emptyColor }}>★</span>)}
      </div>
      {showCount && <span style={{ fontSize: '13px', color: '#6b7280' }}>({displayCount} reviews)</span>}
    </div>
  );
};

ProductRating.craft = { displayName: 'Product Rating' };
