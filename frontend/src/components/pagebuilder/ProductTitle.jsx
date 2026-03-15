import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductTitle = ({
  title = 'Product Name',
  tag = 'h1',
  fontSize = '28px',
  fontWeight = '700',
  textColor = '#111827',
  color,
  textAlign = 'left',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const displayTitle = product?.name || title;
  const Tag = tag;

  // Build base styles from individual props (fallback defaults)
  const baseStyle = {
    fontSize,
    fontWeight,
    color: textColor || color || '#111827',
    textAlign,
    margin: 0,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  };

  // Saved style object is the final authority — it overrides base defaults.
  // If line clamp is active (WebkitLineClamp set), ensure display is -webkit-box
  // even if the user accidentally set display to something else.
  const merged = { ...baseStyle, ...style };
  if (merged.WebkitLineClamp && merged.display !== '-webkit-box') {
    merged.display = '-webkit-box';
  }

  return <Tag className={className} style={merged}>{displayTitle}</Tag>;
};

ProductTitle.craft = { displayName: 'Product Title' };
