import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import BlockWrapper from './BlockWrapper';

export default function CategoryGrid({ block }) {
  const columns = block.columns || 4;

  const { data: categories = [], isLoading } = useQuery(
    ['categoryGrid', block.categorySource, block.categoryLimit],
    async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/categories?limit=${block.categoryLimit || 8}&sort=${block.categorySource === 'top' ? 'productCount' : 'name'}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.categories || json.data || json.categories || [];
    },
    { staleTime: 5 * 60 * 1000, retry: false }
  );

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const resp = block.responsive || {};
  const mobileCol = resp.mobileColumns || 2;
  const tabletCol = resp.tabletColumns || Math.min(columns, 3);
  const desktopCol = resp.desktopColumns || columns;
  const gridCols = `grid-cols-${mobileCol} md:grid-cols-${tabletCol} lg:grid-cols-${desktopCol}`;

  if (isLoading) {
    return (
      <BlockWrapper block={block}>
        <div className={`grid ${gridCols} gap-4`}>
          {[...Array(block.categoryLimit || 8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse" style={{ height: block.imageHeight || '180px' }} />
          ))}
        </div>
      </BlockWrapper>
    );
  }

  if (!categories.length) return null;

  const cardStyle = block.cardStyle || 'card';

  return (
    <BlockWrapper block={block}>
      <div className={`grid ${gridCols} gap-4`}>
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/shop?category=${cat.slug || cat._id}`}
            className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${
              cardStyle === 'circle' ? 'flex flex-col items-center text-center' : 'bg-white border'
            }`}
            style={{ borderRadius: cardStyle === 'circle' ? '50%' : (block.cardBorderRadius || '12px') }}
          >
            {block.showImage !== false && (
              <div
                className={`relative overflow-hidden ${cardStyle === 'circle' ? 'w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto' : 'w-full'}`}
                style={{ height: cardStyle === 'circle' ? undefined : (block.imageHeight || '180px') }}
              >
                {cat.image ? (
                  <img
                    src={resolveImg(cat.image)}
                    alt={cat.name || ''}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
              </div>
            )}
            <div className={`${cardStyle === 'circle' ? 'mt-3' : 'p-4'}`}>
              <h4 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-sm md:text-base">
                {cat.name}
              </h4>
              {block.showProductCount !== false && cat.productCount != null && (
                <p className="text-xs text-gray-400 mt-1">
                  {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </BlockWrapper>
  );
}
