import React from 'react';

export const SVGIcon = ({
  svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
  size = '48px',
  color = '#3b82f6',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color, ...style }}
    dangerouslySetInnerHTML={{ __html: svg }} />
);

SVGIcon.craft = { displayName: 'SVG Icon' };
