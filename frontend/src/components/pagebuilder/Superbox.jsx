import React from 'react';

export const Superbox = ({
  imageSrc = 'https://placehold.co/600x400/e2e8f0/64748b?text=Superbox+Image',
  title = 'Superbox Title',
  description = 'Hover to see the overlay effect',
  overlayColor = 'rgba(0,0,0,0.6)',
  textColor = '#ffffff',
  height = '300px',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', height, ...style }}>
    <img src={imageSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', opacity: 0, transition: 'opacity 0.3s' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}>
      <h3 style={{ color: textColor, fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: textColor, fontSize: '14px', margin: 0, textAlign: 'center', opacity: 0.9 }}>{description}</p>
    </div>
  </div>
);

Superbox.craft = { displayName: 'Superbox' };
