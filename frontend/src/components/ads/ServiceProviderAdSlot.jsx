import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { serviceProviderAdsAPI } from '@/services/api';
import ServiceProviderAdCard from './ServiceProviderAdCard';

/**
 * ServiceProviderAdSlot — fetches contextual ads + display settings,
 * renders a horizontally scrollable carousel after the last center section.
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

  const { data: adsData } = useQuery(
    ['sp-ads', slotId, pageType, productId],
    () => serviceProviderAdsAPI.getContextual({ slotId, pageType, categorySlug, productId, maxAds }),
    { staleTime: 5 * 60 * 1000, retry: false }
  );

  const { data: settingsData } = useQuery(
    ['sp-ad-settings'],
    () => serviceProviderAdsAPI.getAdSettings(),
    { staleTime: 10 * 60 * 1000, retry: false }
  );

  const ads = (adsData?.data?.data || []).slice(0, maxAds);
  const settings = settingsData?.data?.data || {};
  const sectionTitle = settings.sectionTitle || 'Featured Services';

  if (!ads.length) return null;

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const showArrows = ads.length > 3;

  return (
    <div style={{ borderTop: '1px solid #e5eae6', paddingTop: 14, marginTop: 4 }}>
      {/* Section header — 14px left padding matches the section headers above */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f2f0', paddingLeft: 14, paddingRight: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{sectionTitle}</span>
          <span style={{ fontSize: 10, color: '#76889a', fontWeight: 600, letterSpacing: '0.05em' }}>SPONSORED</span>
        </div>
        {showArrows && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              style={{
                width: 28, height: 28, border: '1px solid #e5eae6',
                background: canScrollLeft ? '#fff' : '#f6f7f8',
                cursor: canScrollLeft ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: canScrollLeft ? '#1a1a1a' : '#ccc',
                transition: 'all 0.15s',
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              style={{
                width: 28, height: 28, border: '1px solid #e5eae6',
                background: canScrollRight ? '#fff' : '#f6f7f8',
                cursor: canScrollRight ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: canScrollRight ? '#1a1a1a' : '#ccc',
                transition: 'all 0.15s',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Carousel track — padding matches section body padding */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingLeft: 14,
          paddingRight: 14,
          paddingBottom: 4,
        }}
      >
        {ads.map(ad => (
          <ServiceProviderAdCard key={ad._id} ad={ad} settings={settings} />
        ))}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10, paddingBottom: 4 }}>
          {ads.map((_, i) => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? '#1b5e35' : '#e5eae6' }} />
          ))}
        </div>
      )}
    </div>
  );
}
