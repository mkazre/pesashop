import React from 'react';

export const CopyrightYear = ({
  text = '© {year} All rights reserved.',
  fontSize = '14px',
  color = '#6b7280',
  textAlign = 'center',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ fontSize, color, textAlign, ...style }}>
    {text.replace('{year}', new Date().getFullYear())}
  </div>
);

CopyrightYear.craft = { displayName: 'Copyright Year' };
