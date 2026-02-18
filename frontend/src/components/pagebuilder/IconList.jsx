import React from 'react';

export const IconList = ({
  items = [
    { icon: '✓', text: 'Feature one included', color: '#22c55e' },
    { icon: '✓', text: 'Feature two included', color: '#22c55e' },
    { icon: '✗', text: 'Feature not included', color: '#ef4444' },
  ],
  iconSize = '18px',
  textSize = '14px',
  textColor = '#374151',
  gap = '12px',
  layout = 'vertical',
  className = '',
  style = {},
}) => (
  <ul className={className} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: layout === 'horizontal' ? 'row' : 'column', gap, flexWrap: 'wrap', ...style }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: iconSize, color: item.color || '#3b82f6', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
        <span style={{ fontSize: textSize, color: textColor }}>{item.text}</span>
      </li>
    ))}
  </ul>
);

IconList.craft = { displayName: 'Icon List' };
