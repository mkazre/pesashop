import React, { useState, useEffect, useRef } from 'react';

export const CarouselBuilder = ({
  slides = [
    { image: 'https://placehold.co/800x400/e2e8f0/64748b?text=Slide+1', caption: 'Slide 1' },
    { image: 'https://placehold.co/800x400/e2e8f0/64748b?text=Slide+2', caption: 'Slide 2' },
    { image: 'https://placehold.co/800x400/e2e8f0/64748b?text=Slide+3', caption: 'Slide 3' },
  ],
  autoplay = false,
  autoplaySpeed = 3000,
  showArrows = true,
  showDots = true,
  height = 400,
  className = '',
  style = {},
}) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (autoplay && slides.length > 1) {
      timerRef.current = setInterval(() => setCurrent((p) => (p + 1) % slides.length), autoplaySpeed);
      return () => clearInterval(timerRef.current);
    }
  }, [autoplay, autoplaySpeed, slides.length]);

  if (!slides.length) return <div className={className} style={{ height, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>No slides</div>;

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', height, borderRadius: '8px', ...style }}>
      {slides.map((slide, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <img src={slide.image} alt={slide.caption || `Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {slide.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '14px' }}>{slide.caption}</div>}
        </div>
      ))}
      {showArrows && slides.length > 1 && (
        <>
          <button onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, zIndex: 2 }}>&#8249;</button>
          <button onClick={() => setCurrent((p) => (p + 1) % slides.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, zIndex: 2 }}>&#8250;</button>
        </>
      )}
      {showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
          {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
        </div>
      )}
    </div>
  );
};

CarouselBuilder.craft = { displayName: 'Carousel Builder' };
