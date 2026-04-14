import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { serviceProviderAdsAPI } from '@/services/api';
import ServiceProviderAdCard from './ServiceProviderAdCard';

/**
 * ServiceProviderAdSlot — fetches and renders contextual service provider ads
 * as a horizontally scrollable carousel that matches the InlineLaybyePlans style.
 *
 * Props:
 *   slotId      — e.g. "product_detail_below_buy"
 *   pageType    — e.g. "product", "home", "category"
 *   categorySlug— for contextual matching
 *   productId   — for contextual matching
 *   maxAds      — max ads to fetch (default 6)
 */
export default function ServiceProviderAdSlot({
  slotId,
  pageType,
  categorySlug,
  productId,
  maxAds = 6,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data } = useQuery(
    ['sp-ads', slotId, pageType, productId],
    () => serviceProviderAdsAPI.getContextual({ slotId, pageType, categorySlug, productId, maxAds }),
    { staleTime: 5 * 60 * 1000, retry: false }
  );

  const ads = (data?.data?.data || []).slice(0, maxAds);
  if (!ads.length) return null;

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 240;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const showArrows = ads.length > 3;

  return (
    <div style={{ borderTop: '1px solid #e5eae6', paddingTop: 16, marginTop: 4 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f2f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Featured Services</span>
          <span style={{ fontSize: 10, color: '#76889a', fontWeight: 600, letterSpacing: '0.05em' }}>SPONSORED</span>
        </div>
        {showArrows && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              style={{
                width: 28, height: 28, border: '1px solid #e5eae6', background: canScrollLeft ? '#fff' : '#f6f7f8',
                cursor: canScrollLeft ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: canScrollLeft ? '#1a1a1a' : '#ccc', transition: 'all 0.15s',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              style={{
                width: 28, height: 28, border: '1px solid #e5eae6', background: canScrollRight ? '#fff' : '#f6f7f8',
                cursor: canScrollRight ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: canScrollRight ? '#1a1a1a' : '#ccc', transition: 'all 0.15s',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Carousel track */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',       /* Firefox */
          msOverflowStyle: 'none',      /* IE */
          paddingBottom: 4,
          paddingRight: 4,
        }}
      >
        <style>{`.sp-ad-track::-webkit-scrollbar { display: none; }`}</style>
        {ads.map(ad => (
          <ServiceProviderAdCard key={ad._id} ad={ad} />
        ))}
      </div>

      {/* Dot indicators — shown on mobile when there are multiple ads */}
      {ads.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10 }}>
          {ads.map((_, i) => (
            <div
              key={i}
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: i === 0 ? '#1b5e35' : '#e5eae6',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
