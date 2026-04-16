import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { socialEngineAPI } from '@/services/api';
import TikTokVideoCard from './TikTokVideoCard';

/**
 * TikTokVideoSlot — fetches contextual TikTok videos and renders a
 * horizontally-scrollable portrait-card carousel.
 *
 * Props:
 *   keywords  — string[]  e.g. ['air fryer', 'air fryer review']
 *   pageType  — 'home' | 'shop' | 'product_detail'
 */
export default function TikTokVideoSlot({ keywords = [], pageType }) {
  const scrollRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: settingsData } = useQuery(
    ['social-engine-settings'],
    () => socialEngineAPI.getSettings(),
    { staleTime: 10 * 60 * 1000, retry: false }
  );

  const cfg = settingsData?.data?.data || {};

  const enabledForPage =
    cfg.enabled &&
    (pageType === 'home'           ? cfg.showOnHome           !== false :
     pageType === 'shop'           ? cfg.showOnShop            !== false :
     pageType === 'product_detail' ? cfg.showOnProductDetail   !== false : false);

  const limit = cfg.videosPerCarousel || 8;

  const { data: videosData, isLoading } = useQuery(
    ['social-engine-videos', keywords.join(','), limit],
    () => socialEngineAPI.getVideos(keywords, limit),
    {
      staleTime: 15 * 60 * 1000,
      retry: false,
      enabled: enabledForPage && keywords.length > 0,
    }
  );

  const videos = videosData?.data?.data || [];

  if (!enabledForPage || (!isLoading && !videos.length)) return null;

  const sectionTitle    = cfg.sectionTitle    || 'Featured in Videos';
  const sectionSubtitle = cfg.sectionSubtitle || 'See what creators are sharing';
  const showArrows      = videos.length > 3;

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 190 : -190, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  return (
    <div style={{ borderTop: '1px solid #e5eae6', paddingTop: 14, marginTop: 4 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f0f2f0',
        paddingLeft: 14, paddingRight: 14,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{sectionTitle}</span>
            <span style={{
              fontSize: 9, color: '#fff', fontWeight: 700,
              background: '#010101', padding: '1px 5px', borderRadius: 3,
              letterSpacing: '0.04em',
            }}>TikTok</span>
          </div>
          {sectionSubtitle && (
            <p style={{ fontSize: 11, color: '#76889a', margin: '2px 0 0' }}>{sectionSubtitle}</p>
          )}
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
            >‹</button>
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
            >›</button>
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingLeft: 14,
          paddingRight: 14,
          paddingBottom: 4,
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                flexShrink: 0, width: 160, height: 285, borderRadius: 10,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '400% 100%',
                animation: 'se-shimmer 1.4s infinite',
              }} />
            ))
          : videos.map(video => (
              <TikTokVideoCard key={video.id} video={video} />
            ))
        }
      </div>

      {/* Dot indicators */}
      {videos.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 10, paddingBottom: 4 }}>
          {videos.map((_, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i === 0 ? '#010101' : '#e5eae6',
            }} />
          ))}
        </div>
      )}

      <style>{`@keyframes se-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
