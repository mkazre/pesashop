import React, { useState } from 'react';

export const GallerySlider = ({
  images = [
    { src: 'https://placehold.co/800x400/e2e8f0/64748b?text=Gallery+1', alt: 'Gallery 1' },
    { src: 'https://placehold.co/800x400/e2e8f0/64748b?text=Gallery+2', alt: 'Gallery 2' },
    { src: 'https://placehold.co/800x400/e2e8f0/64748b?text=Gallery+3', alt: 'Gallery 3' },
  ],
  height = '400px',
  showThumbs = true,
  thumbSize = '60px',
  className = '',
  style = {},
}) => {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;

  return (
    <div className={className} style={style}>
      <div style={{ position: 'relative', overflow: 'hidden', height, borderRadius: '8px' }}>
        <img src={images[current]?.src} alt={images[current]?.alt || `Image ${current + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>&#8249;</button>
            <button onClick={() => setCurrent((p) => (p + 1) % images.length)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>&#8250;</button>
          </>
        )}
      </div>
      {showThumbs && images.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {images.map((img, i) => (
            <img key={i} src={img.src} alt={img.alt || `Thumb ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{ width: thumbSize, height: thumbSize, objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: i === current ? '2px solid #3b82f6' : '2px solid transparent', opacity: i === current ? 1 : 0.6, transition: 'all 0.2s', flexShrink: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
};

GallerySlider.craft = { displayName: 'Gallery Slider' };
