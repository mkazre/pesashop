import React from 'react';

export const BurgerTrigger = ({
  lineColor = '#374151',
  lineWidth = '28px',
  lineHeight = '3px',
  gap = '5px',
  className = '',
  style = {},
}) => (
  <button className={className} style={{ display: 'flex', flexDirection: 'column', gap, background: 'none', border: 'none', cursor: 'pointer', padding: '8px', ...style }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ display: 'block', width: lineWidth, height: lineHeight, backgroundColor: lineColor, borderRadius: '2px', transition: 'all 0.3s' }} />
    ))}
  </button>
);

BurgerTrigger.craft = { displayName: 'Burger Trigger' };
