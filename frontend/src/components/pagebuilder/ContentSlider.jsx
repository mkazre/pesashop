import React, { useState, useEffect, useRef } from 'react';

export const ContentSlider = ({
  slides = [
    { title: 'Slide 1', content: 'Content for slide 1', backgroundColor: '#3b82f6' },
    { title: 'Slide 2', content: 'Content for slide 2', backgroundColor: '#8b5cf6' },
    { title: 'Slide 3', content: 'Content for slide 3', backgroundColor: '#ec4899' },
  ],
  autoplay = false,
  autoplaySpeed = 3000,
  showArrows = true,
  showDots = true,
  infinite = true,
  animationSpeed = 0.5,
  height = 400,
  arrowColor = '#ffffff',
  dotColor = '#ffffff80',
  dotActiveColor = '#ffffff',
  showSlideCounter = false,
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

  const slide = slides[current];
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', height, borderRadius: '8px', backgroundColor: slide.backgroundColor || '#3b82f6', transition: `background-color ${animationSpeed}s`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <div style={{ textAlign: 'center', color: '#fff', padding: '24px', maxWidth: '600px' }}>
        {slide.title && <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 700 }}>{slide.title}</h2>}
        {slide.content && <p style={{ margin: 0, fontSize: '16px', opacity: 0.9, lineHeight: 1.6 }}>{slide.content}</p>}
      </div>
      {showArrows && slides.length > 1 && (
        <>
          <button onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', color: arrowColor, border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20, zIndex: 2 }}>&#8249;</button>
          <button onClick={() => setCurrent((p) => (p + 1) % slides.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.2)', color: arrowColor, border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20, zIndex: 2 }}>&#8250;</button>
        </>
      )}
      {showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 2 }}>
          {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === current ? dotActiveColor : dotColor }} />)}
        </div>
      )}
      {showSlideCounter && <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>{current + 1} / {slides.length}</div>}
    </div>
  );
};

ContentSlider.craft = { displayName: 'Content Slider' };
