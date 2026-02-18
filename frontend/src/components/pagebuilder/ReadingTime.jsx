import React from 'react';

export const ReadingTime = ({
  text = '5 min read',
  icon = '📖',
  fontSize = '13px',
  color = '#6b7280',
  className = '',
  style = {},
}) => (
  <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize, color, ...style }}>
    {icon && <span>{icon}</span>}
    {text}
  </span>
);

ReadingTime.craft = { displayName: 'Reading Time' };
