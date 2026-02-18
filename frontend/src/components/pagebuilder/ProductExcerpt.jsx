import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductExcerpt = ({
  excerpt = 'A brief summary of this amazing product. Perfect for quick browsing and comparison shopping.',
  fontSize = '14px',
  textColor = '#6b7280',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const displayExcerpt = product?.shortDescription || product?.description?.substring(0, 200) || excerpt;

  return (
    <p className={className} style={{ fontSize, color: textColor, lineHeight: 1.6, margin: 0, ...style }}>
      {displayExcerpt}
    </p>
  );
};

ProductExcerpt.craft = { displayName: 'Product Excerpt' };
