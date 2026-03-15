import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';

// Convert hex color + opacity% to rgba string
function overlayRgba(color, opacity) {
  const c = color || '#000000';
  const o = (opacity ?? 0) / 100;
  if (o <= 0) return 'transparent';
  const r = parseInt(c.slice(1, 3), 16) || 0;
  const g = parseInt(c.slice(3, 5), 16) || 0;
  const b = parseInt(c.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${o})`;
}

export default function HeroSliderWithSideBanner({ block }) {
  const slides = block.slides || [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!block.sliderAutoplay || paused || slides.length <= 1) return;
    const timer = setInterval(next, block.sliderSpeed || 5000);
    return () => clearInterval(timer);
  }, [block.sliderAutoplay, block.sliderSpeed, paused, slides.length, next]);

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  if (!slides.length) return null;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <div className="flex gap-4">
        {/* Slider — 8 cols */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ height: block.sliderHeight || '450px', borderRadius: block.sliderBorderRadius || '12px' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                opacity: block.sliderEffect === 'fade' ? (i === current ? 1 : 0) : 1,
                transform: block.sliderEffect !== 'fade' ? `translateX(${(i - current) * 100}%)` : undefined,
                backgroundImage: slide.image ? `url(${resolveImg(slide.image)})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: slide.image ? undefined : '#f3f4f6',
              }}
            >
              <div className="absolute inset-0" style={{ backgroundColor: slide.overlayOpacity != null ? overlayRgba(slide.overlayColor, slide.overlayOpacity) : (slide.overlayColor || 'transparent') }} />
              <div
                className={`relative z-10 h-full flex flex-col justify-center px-8 md:px-12 ${
                  slide.textAlign === 'center' ? 'items-center text-center' : slide.textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'
                }`}
              >
                {slide.heading && (
                  <h1
                    className="text-2xl md:text-4xl font-bold mb-3 leading-tight"
                    style={{ color: slide.textColor || '#ffffff' }}
                    dangerouslySetInnerHTML={{ __html: slide.heading.replace(/\n/g, '<br/>') }}
                  />
                )}
                {slide.subtitle && (
                  <p className="text-sm md:text-base mb-5 max-w-lg" style={{ color: slide.textColor || '#ffffff', opacity: 0.9 }}>
                    {slide.subtitle}
                  </p>
                )}
                {slide.buttonText && slide.buttonLink && (
                  <Link
                    to={slide.buttonLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg transition-colors shadow-lg text-sm"
                    style={{ backgroundColor: block.buttonBgColor || block.primaryColor || '#0F604B' }}
                  >
                    {slide.buttonText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {block.showArrows !== false && slides.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {block.showDots !== false && slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Side banner — 4 cols (hidden on smaller screens) */}
        <div
          className="hidden xl:flex w-[340px] flex-shrink-0 rounded-xl overflow-hidden relative"
          style={{
            height: block.sliderHeight || '450px',
            backgroundImage: block.sideBannerImage ? `url(${resolveImg(block.sideBannerImage)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: block.sideBannerImage ? undefined : '#e8f5e9',
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: overlayRgba(block.sideBannerOverlayColor, block.sideBannerOverlayOpacity) }} />
          <div className="relative z-10 p-8 flex flex-col justify-center">
            {block.sideBannerHeading && (
              <h2
                className="text-2xl font-bold mb-8 leading-relaxed"
                style={{ color: block.sideBannerTextColor || '#333' }}
                dangerouslySetInnerHTML={{ __html: block.sideBannerHeading.replace(/\n/g, '<br/>') }}
              />
            )}
            {block.sideBannerButtonText && (
              <Link
                to={block.sideBannerButtonLink || '/shop'}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg transition-colors text-sm self-start"
                style={{ backgroundColor: block.buttonBgColor || block.primaryColor || '#0F604B' }}
              >
                {block.sideBannerButtonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </BlockWrapper>
  );
}
