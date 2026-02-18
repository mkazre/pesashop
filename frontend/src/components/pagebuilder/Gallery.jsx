import React, { useState } from 'react';

export const Gallery = ({
  images = [],
  columns = 3,
  gap = '8px',
  lightbox = true,
  className = '',
  style = {},
}) => {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const { responsive, responsiveProps, badge, ...cleanStyle } = style || {};
  return (
    <div className={className} style={cleanStyle}>
      <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {images.map((img, i) => (
          <div key={i} style={{ overflow: 'hidden', borderRadius: '4px', cursor: lightbox ? 'pointer' : 'default' }}
            onClick={() => lightbox && setLightboxIndex(i)}>
            <img src={img.src} alt={img.alt || `Image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
      {lightbox && lightboxIndex >= 0 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setLightboxIndex(-1)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(0, lightboxIndex - 1)); }}
            style={{ position: 'absolute', left: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>&#8249;</button>
          <img src={images[lightboxIndex]?.src} alt={images[lightboxIndex]?.alt}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1)); }}
            style={{ position: 'absolute', right: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>&#8250;</button>
          <button onClick={() => setLightboxIndex(-1)}
            style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>&#10005;</button>
        </div>
      )}
    </div>
  );
};

Gallery.craft = { displayName: 'Gallery' };
