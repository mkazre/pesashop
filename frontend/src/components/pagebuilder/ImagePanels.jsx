import React from 'react';

export const ImagePanels = ({
  panels = [
    { src: 'https://placehold.co/400x600/3b82f6/ffffff?text=Panel+1', title: 'Panel 1' },
    { src: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Panel+2', title: 'Panel 2' },
    { src: 'https://placehold.co/400x600/ec4899/ffffff?text=Panel+3', title: 'Panel 3' },
    { src: 'https://placehold.co/400x600/f59e0b/ffffff?text=Panel+4', title: 'Panel 4' },
  ],
  height = '400px',
  gap = '4px',
  textColor = '#ffffff',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', gap, height, overflow: 'hidden', borderRadius: '8px', ...style }}>
    {panels.map((panel, i) => (
      <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden', transition: 'flex 0.4s ease', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.flex = '3'; }}
        onMouseLeave={(e) => { e.currentTarget.style.flex = '1'; }}>
        <img src={panel.src} alt={panel.title || `Panel ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {panel.title && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: textColor, fontSize: '14px', fontWeight: 600 }}>
            {panel.title}
          </div>
        )}
      </div>
    ))}
  </div>
);

ImagePanels.craft = { displayName: 'Image Panels' };
