import React from 'react';

export const FancyIcon = ({
  icon = '★',
  size = '48px',
  color = '#3b82f6',
  backgroundColor = '',
  borderRadius = '50%',
  padding = '16px',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size, color, backgroundColor: backgroundColor || 'transparent', borderRadius, padding: backgroundColor ? padding : '0', lineHeight: 1, ...style }}>
    {icon}
  </div>
);

FancyIcon.craft = { displayName: 'Fancy Icon' };
