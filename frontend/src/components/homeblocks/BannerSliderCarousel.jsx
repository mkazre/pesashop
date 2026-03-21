import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';

export default function BannerSliderCarousel({ block }) {
  const banners = block.banners || [];
  const slidesToShow = block.slidesToShow || 4;
  const [offset, setOffset] = useState(0);

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const maxOffset = Math.max(0, banners.length - slidesToShow);
  const next = useCallback(() => setOffset(o => Math.min(o + 1, maxOffset)), [maxOffset]);
  const prev = useCallback(() => setOffset(o => Math.max(o - 1, 0)), []);

  useEffect(() => {
    if (!block.autoplay || banners.length <= slidesToShow) return;
    const timer = setInterval(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1));
    }, block.autoplaySpeed || 4000);
    return () => clearInterval(timer);
  }, [block.autoplay, block.autoplaySpeed, banners.length, slidesToShow, maxOffset]);

  if (!banners.length) return null;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${offset * (100 / slidesToShow)}%)` }}
        >
          {banners.map((banner, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / slidesToShow}%` }}
            >
              <Link
                to={banner.buttonLink || '/shop'}
                className="relative block rounded-xl overflow-hidden group"
                style={{
                  height: block.bannerHeight || '200px',
                  borderRadius: block.bannerBorderRadius || '12px',
                }}
              >
                {banner.image ? (
                  <img
                    src={resolveImg(banner.image)}
                    alt={banner.heading || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100" />
                )}
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 z-10 p-4 flex flex-col justify-center">
                  {banner.label && (
                    <span className="text-xs font-medium mb-1" style={{ color: banner.textColor || '#333' }}>
                      {banner.label}
                    </span>
                  )}
                  {banner.heading && (
                    <h4 className="font-bold text-sm md:text-base" style={{ color: banner.textColor || '#333' }}>
                      {banner.heading}
                    </h4>
                  )}
                  {banner.buttonText && (
                    <span
                      className="text-xs font-semibold mt-2 inline-flex items-center gap-1"
                      style={{ color: block.linkColor || block.primaryColor || '#0F604B' }}
                    >
                      {banner.buttonText}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {banners.length > slidesToShow && (
          <>
            <button onClick={prev} disabled={offset === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={next} disabled={offset >= maxOffset} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
    </BlockWrapper>
  );
}
