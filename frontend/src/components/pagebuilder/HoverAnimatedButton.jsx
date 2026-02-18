import React from 'react';

export const HoverAnimatedButton = ({
  text = 'Hover Me',
  url = '#',
  hoverEffect = 'slide-right',
  backgroundColor = '#3b82f6',
  hoverColor = '#1d4ed8',
  textColor = '#ffffff',
  fontSize = '14px',
  fontWeight = '600',
  padding = '12px 32px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => (
  <a href={url} className={className}
    style={{ display: 'inline-block', padding, backgroundColor, color: textColor, fontSize, fontWeight, borderRadius, textDecoration: 'none', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden', ...style }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverColor; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = backgroundColor; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
    {text}
  </a>
);

HoverAnimatedButton.craft = { displayName: 'Hover Animated Button' };
