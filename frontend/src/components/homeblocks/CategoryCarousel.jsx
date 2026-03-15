import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { categoriesAPI } from '../../services/api';
import BlockWrapper from './BlockWrapper';

export default function CategoryCarousel({ block }) {
  const scrollRef = useRef(null);

  const { data: categories = [], isLoading } = useQuery(
    ['blockCategories', block.categorySource, block.categoryLimit],
    async () => {
      const params = { limit: block.categoryLimit || 10 };
      if (block.categorySource === 'top') params.sort = '-productCount';
      const res = await categoriesAPI.getAll(params);
      return res.data?.data?.categories || res.data?.data || res.data?.categories || [];
    },
    { staleTime: 60 * 1000 }
  );

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  const resolveImg = (url) => {
    if (!url) return '';
    if (typeof url === 'object') url = url.url || url.src || '';
    if (typeof url !== 'string' || !url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url.startsWith('/') ? url : '/' + url}`;
  };


  return (
    <BlockWrapper block={block}>
      <div className="relative group">
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-[120px] flex-shrink-0 h-[140px] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <>
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.map((cat, i) => {
                const img = cat.iconImage || cat.image;
                return (
                  <Link
                    key={cat._id}
                    to={`/shop/${cat.slug || cat._id}`}
                    className="flex-shrink-0 w-[120px] flex flex-col items-center p-4 rounded-xl hover:shadow-lg transition-all duration-300 group/card"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center mb-2 shadow-sm group-hover/card:scale-110 transition-transform">
                      {img ? (
                        <img src={resolveImg(img)} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center line-clamp-2">{cat.name}</span>
                    {block.showCategoryProductCount !== false && cat.productCount !== undefined && (
                      <span className="text-[10px] text-gray-400 mt-0.5">{cat.productCount} items</span>
                    )}
                  </Link>
                );
              })}
            </div>
            <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">No categories found</div>
        )}
      </div>
    </BlockWrapper>
  );
}
