import React from 'react';

export const DualColorText = ({
  text = 'Dual Color Text',
  firstColor = '#3b82f6',
  secondColor = '#ef4444',
  splitAt = 50,
  fontSize = '32px',
  fontWeight = '700',
  className = '',
  style = {},
}) => {
  const splitIndex = Math.round((text.length * splitAt) / 100);
  const first = text.slice(0, splitIndex);
  const second = text.slice(splitIndex);
  return (
    <span className={className} style={{ fontSize, fontWeight, ...style }}>
      <span style={{ color: firstColor }}>{first}</span>
      <span style={{ color: secondColor }}>{second}</span>
    </span>
  );
};

DualColorText.craft = { displayName: 'Dual Color Text' };
