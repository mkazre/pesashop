import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrencyStore } from '@/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '/placeholder.jpg';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

function StarRating({ rating, count }) {
  if (!rating && !count) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <svg key={star} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={star <= Math.round(rating || 0) ? '#f59e0b' : '#e5e7eb'}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  );
}

function CarouselCard({ product }) {
  const { formatPrice } = useCurrencyStore();
  const price = product.salePrice || product.regularPrice;
  const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
  const discount = hasDiscount ? Math.round((1 - product.salePrice / product.regularPrice) * 100) : 0;
  const img = getImg(product.featuredImage || product.images?.[0]);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="block bg-white rounded-lg border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden group h-full"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.name}
        </h4>
        <StarRating rating={product.rating} count={product.reviewCount} />
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View product →
        </div>
      </div>
    </Link>
  );
}

export default function ProductCarousel({ products = [], isLoading = false, emptyMessage = '' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    updateScrollState();
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [products, updateScrollState]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector('[data-carousel-card]')?.offsetWidth || 170;
    scrollRef.current.scrollBy({ left: dir * (cardWidth + 12) * 2, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden', width: '100%' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse" style={{ width: 170, flexShrink: 0 }}>
            <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    if (emptyMessage) return <div className="text-center py-8 text-gray-400 text-sm">{emptyMessage}</div>;
    return null;
  }

  return (
    <div className="relative group/carousel" style={{ overflow: 'hidden', width: '100%', minWidth: 0 }}>
      <style>{`
        .pc-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="pc-scroll"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 8,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
        }}
      >
        {products.map(product => (
          <div
            key={product._id}
            data-carousel-card
            style={{ width: 170, minWidth: 170, maxWidth: 170, flexShrink: 0 }}
          >
            <CarouselCard product={product} />
          </div>
        ))}
      </div>

      {/* Nav arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-10 hover:scale-110 border border-gray-100"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-10 hover:scale-110 border border-gray-100"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
