import React from 'react';

export const ArchiveDescription = ({
  description = 'Browse our collection of premium products. Find exactly what you need with our curated selection.',
  fontSize = '15px',
  textColor = '#6b7280',
  className = '',
  style = {},
}) => (
  <p className={className} style={{ fontSize, color: textColor, lineHeight: 1.6, margin: 0, ...style }}>
    {description}
  </p>
);

ArchiveDescription.craft = { displayName: 'Archive Description' };
