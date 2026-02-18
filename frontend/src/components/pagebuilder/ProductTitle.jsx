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
  return <Tag className={className} style={{ fontSize, fontWeight, color: textColor || color || '#111827', textAlign, margin: 0, overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', ...style }}>{displayTitle}</Tag>;
};

ProductTitle.craft = { displayName: 'Product Title' };
