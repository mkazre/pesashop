import React from 'react';

export const Rating = ({
  value = 4,
  max = 5,
  size = '24px',
  activeColor = '#fbbf24',
  inactiveColor = '#d1d5db',
  showValue = true,
  label = '',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
    {label && <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{label}</span>}
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: size, color: i < value ? activeColor : inactiveColor, lineHeight: 1 }}>★</span>
      ))}
    </div>
    {showValue && <span style={{ fontSize: '14px', color: '#6b7280' }}>{value}/{max}</span>}
  </div>
);

Rating.craft = { displayName: 'Rating' };
