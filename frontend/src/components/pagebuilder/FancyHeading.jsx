import React from 'react';

export const FancyHeading = ({
  beforeText = '',
  mainText = 'Fancy Heading',
  afterText = '',
  tag = 'h2',
  mainColor = '#3b82f6',
  beforeColor = '#374151',
  afterColor = '#374151',
  fontSize = '36px',
  fontWeight = '700',
  textAlign = 'center',
  className = '',
  style = {},
}) => {
  const Tag = tag;
  return (
    <Tag className={className} style={{ fontSize, fontWeight, textAlign, margin: 0, lineHeight: 1.3, ...style }}>
      {beforeText && <span style={{ color: beforeColor }}>{beforeText} </span>}
      <span style={{ color: mainColor }}>{mainText}</span>
      {afterText && <span style={{ color: afterColor }}> {afterText}</span>}
    </Tag>
  );
};

FancyHeading.craft = { displayName: 'Fancy Heading' };
