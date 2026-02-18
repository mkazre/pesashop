import React, { useState, useEffect, useRef } from 'react';

export const Slider = ({ slides = [], className = '', style = {} }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const {
    autoplay = false, autoplaySpeed = 3000, showArrows = true, showDots = true,
    showCaptions = true, infinite = true, animationSpeed = 0.5, height = 400,
    arrowsColor = '#ffffff', dotsColor = '#ffffff80', dotsActiveColor = '#3b82f6',
    captionPosition = 'bottom', captionBgColor = 'rgba(0,0,0,0.7)', captionTextColor = '#ffffff',
    ...restStyle
  } = style;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoplay && slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((p) => (p + 1) % slides.length);
      }, autoplaySpeed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, autoplaySpeed, slides.length]);

  const go = (dir) => {
    if (dir === 'prev') setCurrent((p) => (p - 1 + slides.length) % slides.length);
    else setCurrent((p) => (p + 1) % slides.length);
  };

  if (!slides.length) return <div className={className} style={{ height, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', ...restStyle }}>No slides</div>;

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', height, borderRadius: '8px', ...restStyle }}>
      {slides.map((slide, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: `opacity ${animationSpeed}s ease` }}>
          <img src={slide.image} alt={slide.title || `Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {showCaptions && (slide.title || slide.caption) && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: captionBgColor, color: captionTextColor }}>
              {slide.title && <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>{slide.title}</div>}
              {slide.caption && <div style={{ fontSize: '14px', opacity: 0.9 }}>{slide.caption}</div>}
            </div>
          )}
        </div>
      ))}
      {showArrows && slides.length > 1 && (
        <>
          <button onClick={() => go('prev')} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: arrowsColor, border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&#8249;</button>
          <button onClick={() => go('next')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: arrowsColor, border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&#8250;</button>
        </>
      )}
      {showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: showCaptions ? 60 : 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === current ? dotsActiveColor : dotsColor }} />
          ))}
        </div>
      )}
    </div>
  );
};

Slider.craft = { displayName: 'Slider' };
