import React from 'react';

export const CartCounter = ({
  count = 0,
  icon = '🛒',
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  size = '40px',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    <span style={{ fontSize: `calc(${size} * 0.6)` }}>{icon}</span>
    {count > 0 && (
      <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor, color: textColor, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
        {count}
      </span>
    )}
  </div>
);

CartCounter.craft = { displayName: 'Cart Counter' };
