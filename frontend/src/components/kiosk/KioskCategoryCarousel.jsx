import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { categoriesAPI } from '@/services/api';
import { resolveUrl as resolveImg } from '@/utils/kioskUrl';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';

/**
 * Touch-friendly category carousel for the kiosk — same shape as the website's
 * CategoryCarousel block but bigger tiles (120px → 180px) and self-contained
 * (no page-builder block prop).
 */
export default function KioskCategoryCarousel({ title = 'Browse Categories', limit = 30 }) {
  const navigate = useNavigate();
  const { category: activeCategorySlug } = useParams();
  const scrollRef = useRef(null);

  const { data: categories = [], isLoading } = useQuery(
    ['kiosk-category-carousel', limit],
    async () => {
      const res = await categoriesAPI.getAll({ limit, sort: '-productCount' });
      return res.data?.data?.categories || res.data?.data || res.data?.categories || [];
    },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 480, behavior: 'smooth' });
  };

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="relative">
      {title && (
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">{title}</h2>
      )}

      <div className="relative">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[180px] h-[200px] flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto kiosk-scroll scroll-smooth pb-2 -mx-2 px-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {/* "All" tile — clears the category filter */}
              <button
                onClick={() => navigate('/kiosk/shop')}
                className={`kiosk-tile flex-shrink-0 w-[160px] md:w-[180px] flex flex-col items-center justify-start p-5 rounded-2xl bg-white shadow-sm border-2 transition ${!activeCategorySlug ? 'border-primary' : 'border-transparent'}`}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-3xl">🛍️</span>
                </div>
                <span className="text-base font-semibold text-gray-800 text-center leading-tight">All Products</span>
              </button>

              {categories.map((cat) => {
                const img = cat.iconImage || cat.image;
                const isActive = activeCategorySlug && (cat.slug === activeCategorySlug);
                return (
                  <button
                    key={cat._id}
                    onClick={() => navigate(`/kiosk/shop/${cat.slug || cat._id}`)}
                    className={`kiosk-tile flex-shrink-0 w-[160px] md:w-[180px] flex flex-col items-center justify-start p-5 rounded-2xl bg-white shadow-sm border-2 transition ${isActive ? 'border-primary' : 'border-transparent'}`}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center mb-3">
                      {img ? (
                        <img src={resolveImg(img)} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-3xl">📦</span>
                      )}
                    </div>
                    <span className="text-base font-semibold text-gray-800 text-center leading-tight line-clamp-2">{cat.name}</span>
                    {typeof cat.productCount === 'number' && (
                      <span className="text-xs text-gray-400 mt-1">{cat.productCount} items</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center z-10"
              aria-label="Scroll left"
            >
              <IoChevronBackOutline size={22} className="text-gray-700" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center z-10"
              aria-label="Scroll right"
            >
              <IoChevronForwardOutline size={22} className="text-gray-700" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
