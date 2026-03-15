import React from 'react';

const EFFECT_STYLES = {
  'slide-right': `
    .hover-btn-slide-right { position: relative; overflow: hidden; z-index: 1; }
    .hover-btn-slide-right::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: var(--hover-color); transition: left 0.3s ease; z-index: -1; }
    .hover-btn-slide-right:hover::before { left: 0; }
  `,
  'scale': `.hover-btn-scale:hover { transform: scale(1.05); }`,
  'shadow': `.hover-btn-shadow:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.2); transform: translateY(-2px); }`,
};

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
  <div className={`hover-animated-btn ${className}`} style={style}>
    <style dangerouslySetInnerHTML={{ __html: EFFECT_STYLES[hoverEffect] || '' }} />
    <a href={url}
      className={`hover-btn-${hoverEffect}`}
      style={{
        '--hover-color': hoverColor,
        display: 'inline-block', padding, backgroundColor, color: textColor, fontSize, fontWeight,
        borderRadius, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
      }}>
      {text}
    </a>
  </div>
);

HoverAnimatedButton.craft = { displayName: 'Hover Animated Button' };
