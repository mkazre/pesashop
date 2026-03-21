import React, { useState, useEffect, useCallback } from 'react';
import BlockWrapper from './BlockWrapper';

export default function CouponCarousel({ block }) {
  const coupons = block.coupons || [];
  const slidesToShow = block.slidesToShow || 3;
  const [offset, setOffset] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const maxOffset = Math.max(0, coupons.length - slidesToShow);

  useEffect(() => {
    if (!block.autoplay || coupons.length <= slidesToShow) return;
    const timer = setInterval(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [block.autoplay, coupons.length, slidesToShow, maxOffset]);

  const copyCode = (code, i) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(-1), 2000);
    });
  };

  if (!coupons.length) return null;

  return (
    <BlockWrapper block={block}>
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${offset * (100 / slidesToShow)}%)` }}
        >
          {coupons.map((coupon, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / slidesToShow}%` }}
            >
              <div
                className="rounded-xl p-5 h-full flex flex-col"
                style={{ backgroundColor: coupon.bgColor || '#0F604B', color: coupon.textColor || '#ffffff' }}
              >
                <h3 className="text-xl font-bold mb-1">{coupon.title}</h3>
                {coupon.description && <p className="text-sm opacity-90 mb-1">{coupon.description}</p>}
                {coupon.validText && <p className="text-xs opacity-70 mb-3">{coupon.validText}</p>}
                {coupon.code && (
                  <div className="mt-auto flex items-center gap-2">
                    <span className="text-sm font-mono bg-white/20 px-3 py-1.5 rounded">{coupon.code}</span>
                    <button
                      onClick={() => copyCode(coupon.code, i)}
                      className="text-xs font-semibold px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {copiedIndex === i ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {coupons.length > slidesToShow && (
          <>
            <button onClick={() => setOffset(o => Math.max(o - 1, 0))} disabled={offset === 0} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setOffset(o => Math.min(o + 1, maxOffset))} disabled={offset >= maxOffset} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
    </BlockWrapper>
  );
}
