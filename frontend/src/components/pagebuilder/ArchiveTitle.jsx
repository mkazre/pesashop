import React from 'react';

export const ArchiveTitle = ({
  title = 'Shop',
  tag = 'h1',
  fontSize = '32px',
  fontWeight = '700',
  color = '#111827',
  textAlign = 'left',
  className = '',
  style = {},
}) => {
  const Tag = tag;
  return (
    <Tag className={className} style={{ fontSize, fontWeight, color, textAlign, margin: 0, ...style }}>
      {title}
    </Tag>
  );
};

ArchiveTitle.craft = { displayName: 'Archive Title' };
