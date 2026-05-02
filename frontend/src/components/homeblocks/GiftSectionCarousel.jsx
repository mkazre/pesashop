import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';
import { useBlockProducts } from './useBlockProducts';
import { useCurrencyStore } from '@/store';
import SmartIcon from '../common/SmartIcon';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function img(src) {
  if (!src) return '';
  if (typeof src === 'object' && src.url) return img(src.url);
  if (typeof src !== 'string') return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return `${API_URL}${src.startsWith('/') ? src : '/' + src}`;
}

function pickPrice(p) {
  return p?.salePrice || p?.regularPrice || p?.price || 0;
}
function pickRegularPrice(p) {
  return p?.regularPrice || p?.price || 0;
}

// Map an aspect string to a CSS aspect-ratio value.
function aspectToRatio(aspect) {
  switch (aspect) {
    case '4:3': return '4 / 3';
    case '3:4': return '3 / 4';
    case '4:5': return '4 / 5';
    case '1:1':
    default:    return '1 / 1';
  }
}

// ── Single product tile inside a section card ────────────────────────────────
// Tile has a fixed structure so every tile in a row has the same height:
//   [ image (fixed aspect) ]
//   [ title (only in detailed; clamped to N lines, RESERVES that height) ]
//   [ price row (always at the bottom via mt-auto) ]
function ProductTile({ product, cardStyle, titleClamp, imageAspect }) {
  const { formatPrice } = useCurrencyStore();
  const onSale = product.salePrice && product.salePrice < product.regularPrice;
  const cover = img(product.featuredImage || product.images?.[0]);
  const showTitle = cardStyle === 'detailed';
  const clamp = Math.max(1, Math.min(3, titleClamp || 2));

  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className="group flex flex-col h-full text-center hover:opacity-90 transition-opacity"
    >
      {/* Image — fixed aspect so every tile's image area is identical */}
      <div
        className="w-full overflow-hidden flex items-center justify-center bg-white"
        style={{ aspectRatio: aspectToRatio(imageAspect) }}
      >
        {cover ? (
          <img
            src={cover}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-[1.03] transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      {/* Title — reserves N lines of space whether the text is short or long */}
      {showTitle && (
        <p
          className="text-xs text-gray-700 mt-1.5 px-1"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: clamp,
            overflow: 'hidden',
            // Reserve clamp-line worth of vertical space so prices align across tiles
            // even when titles are shorter than the clamp limit.
            minHeight: `calc(${clamp} * 1.4em)`,
            lineHeight: '1.4em',
          }}
        >
          {product.name}
        </p>
      )}

      {/* Price row — always pinned to the bottom of the tile */}
      <div className="mt-auto pt-1.5 px-1 flex items-baseline gap-1 justify-center flex-wrap">
        {onSale && <span className="text-[10px] uppercase font-semibold text-emerald-700">Now</span>}
        <span className="text-sm font-bold text-gray-900">{formatPrice(pickPrice(product))}</span>
        {onSale && (
          <span className="text-[10px] text-gray-400 line-through">{formatPrice(pickRegularPrice(product))}</span>
        )}
      </div>
    </Link>
  );
}

// ── Single section card (header + product grid) ─────────────────────────────
function SectionCard({ section, block }) {
  const { data: products = [], isLoading } = useBlockProducts(section.source || 'newest', {
    categoryId: section.categoryId,
    productIds: section.productIds,
    limit: section.productLimit || block.giftProductsPerSection || 4,
  });

  const cols = block.giftProductColumns || 2;
  const productGap = '8px';
  const cardStyle = block.giftCardStyle || 'compact';
  const titleClamp = block.giftCardTitleClamp || 2;
  const imageAspect = block.giftCardImageAspect || '1:1';

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: block.giftSectionBgColor || '#ffffff',
        border: `${block.giftSectionBorderWidth || '1px'} solid ${block.giftSectionBorderColor || '#e5e7eb'}`,
        borderRadius: block.giftSectionBorderRadius || '8px',
      }}
    >
      {/* Section header (tinted bar at top) */}
      <div
        className="flex items-center justify-between"
        style={{
          background: section.headerBgColor || '#f3f4f6',
          padding: '10px 12px',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {section.icon && <SmartIcon value={section.icon} size={16} />}
          <h3
            className="truncate"
            style={{
              fontSize: block.giftSectionTitleSize || '14px',
              fontWeight: block.giftSectionTitleWeight || '700',
              color: block.giftSectionTitleColor || '#111827',
            }}
          >
            {section.title}
          </h3>
        </div>
        {section.viewAllLink && (
          <Link
            to={section.viewAllLink}
            className="text-xs font-medium underline hover:no-underline whitespace-nowrap"
            style={{ color: block.giftSectionViewAllColor || '#0F604B' }}
          >
            {section.viewAllText || 'View all'}
          </Link>
        )}
      </div>

      {/* Product grid */}
      <div
        className="flex-1 flex flex-col"
        style={{
          padding: block.giftSectionPadding || '12px',
        }}
      >
        {isLoading ? (
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: '1fr',
              gap: productGap,
            }}
          >
            {Array.from({ length: section.productLimit || 4 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: aspectToRatio(imageAspect) }} className="bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">No products yet</div>
        ) : (
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              // grid-auto-rows: 1fr makes every row in this section equal height,
              // which is what keeps prices and titles aligned across tiles.
              gridAutoRows: '1fr',
              gap: productGap,
            }}
          >
            {products.slice(0, section.productLimit || 4).map((p) => (
              <ProductTile
                key={p._id}
                product={p}
                cardStyle={cardStyle}
                titleClamp={titleClamp}
                imageAspect={imageAspect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main carousel block ─────────────────────────────────────────────────────
export default function GiftSectionCarousel({ block }) {
  const sections = block.giftSections || [];

  // Detect viewport breakpoint to choose visible-count
  const [bp, setBp] = useState('desktop');
  useEffect(() => {
    const detect = () => {
      const w = window.innerWidth;
      if (w < 640) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  const visible = bp === 'mobile'
    ? (block.giftSectionsVisibleMobile || 1)
    : bp === 'tablet'
      ? (block.giftSectionsVisibleTablet || 2)
      : (block.giftSectionsVisibleDesktop || 4);

  const visiblePerSlide = Math.max(1, Math.min(visible, sections.length || 1));
  const totalPages = Math.max(1, Math.ceil(sections.length / visiblePerSlide));

  const [page, setPage] = useState(0);
  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [page, totalPages]);

  // Autoplay
  const autoplayRef = useRef(null);
  useEffect(() => {
    if (!block.giftAutoplay || totalPages <= 1) return;
    autoplayRef.current = setInterval(() => {
      setPage((p) => (p + 1) % totalPages);
    }, Math.max(1500, block.giftAutoplayInterval || 5000));
    return () => clearInterval(autoplayRef.current);
  }, [block.giftAutoplay, block.giftAutoplayInterval, totalPages]);

  if (sections.length === 0) {
    return (
      <BlockWrapper block={block}>
        <div className="text-center text-sm text-gray-400 py-8">No sections yet — add some from the admin panel.</div>
      </BlockWrapper>
    );
  }

  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const goNext = () => setPage((p) => (p + 1) % totalPages);

  return (
    <BlockWrapper block={block}>
      <div className="relative">
        {/* Track — translates by page * 100% */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${page * 100}%)`,
              gap: 0,
            }}
          >
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const start = pageIdx * visiblePerSlide;
              const slice = sections.slice(start, start + visiblePerSlide);
              return (
                <div
                  key={pageIdx}
                  className="grid flex-shrink-0 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${visiblePerSlide}, minmax(0, 1fr))`,
                    gap: block.giftSectionGap || '16px',
                  }}
                >
                  {slice.map((section, i) => (
                    <SectionCard key={start + i} section={section} block={block} />
                  ))}
                  {/* Pad with empty placeholders so the last page has full columns */}
                  {slice.length < visiblePerSlide && Array.from({ length: visiblePerSlide - slice.length }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrows */}
        {block.giftShowArrows !== false && totalPages > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous"
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={goNext}
              aria-label="Next"
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Dots */}
        {block.giftShowDots !== false && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === page ? 'bg-gray-900 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </BlockWrapper>
  );
}
