import React from 'react';

export const HighlightedHeading = ({
  beforeText = 'We provide ',
  highlightText = 'amazing',
  afterText = ' solutions',
  tag = 'h2',
  highlightColor = '#fbbf24',
  highlightStyle = 'background',
  textColor = '#111827',
  fontSize = '32px',
  fontWeight = '700',
  textAlign = 'center',
  className = '',
  style = {},
}) => {
  const Tag = tag;
  const hlStyle = highlightStyle === 'underline'
    ? { borderBottom: `3px solid ${highlightColor}`, paddingBottom: '2px' }
    : highlightStyle === 'circle'
    ? { border: `2px solid ${highlightColor}`, borderRadius: '50%', padding: '0 8px' }
    : { backgroundColor: highlightColor, padding: '0 6px', borderRadius: '4px' };

  return (
    <Tag className={className} style={{ fontSize, fontWeight, textAlign, color: textColor, margin: 0, lineHeight: 1.4, ...style }}>
      {beforeText}
      <span style={hlStyle}>{highlightText}</span>
      {afterText}
    </Tag>
  );
};

HighlightedHeading.craft = { displayName: 'Highlighted Heading' };
