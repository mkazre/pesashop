import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductDescription = ({
  description = 'This premium product features high-quality materials and exceptional craftsmanship.',
  fontSize = '14px',
  textColor = '#374151',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const displayDescription = product?.shortDescription || product?.description || description;
  return (
    <div className={className} style={{ fontSize, color: textColor, lineHeight: 1.7, overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', ...style }}>
      {displayDescription}
    </div>
  );
};

ProductDescription.craft = { displayName: 'Product Description' };
