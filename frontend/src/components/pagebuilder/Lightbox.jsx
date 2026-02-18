import React, { useState } from 'react';

export const Lightbox = ({
  images = [
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+1', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+1', alt: 'Photo 1' },
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+2', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+2', alt: 'Photo 2' },
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+3', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+3', alt: 'Photo 3' },
  ],
  columns = 3,
  gap = '8px',
  thumbBorderRadius = '8px',
  className = '',
  style = {},
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div className={className} style={style}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setActiveIndex(i)} style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: thumbBorderRadius }}>
            <img src={img.thumb || img.src} alt={img.alt || `Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }} />
          </div>
        ))}
      </div>
      {activeIndex >= 0 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setActiveIndex(-1)}>
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex(Math.max(0, activeIndex - 1)); }}
            style={{ position: 'absolute', left: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>&#8249;</button>
          <img src={images[activeIndex]?.src} alt={images[activeIndex]?.alt}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex(Math.min(images.length - 1, activeIndex + 1)); }}
            style={{ position: 'absolute', right: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>&#8250;</button>
          <button onClick={() => setActiveIndex(-1)}
            style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
          <div style={{ position: 'absolute', bottom: 20, color: '#fff', fontSize: 14 }}>{activeIndex + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
};

Lightbox.craft = { displayName: 'Lightbox' };
