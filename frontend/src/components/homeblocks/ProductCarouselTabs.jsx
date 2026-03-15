import React, { useState, useRef, useCallback, useEffect } from 'react';
import BlockWrapper from './BlockWrapper';
import ProductCard from './ProductCard';
import { useBlockProducts } from './useBlockProducts';
import { useBlockBadges } from './useBlockBadges';
import { getCardStyleProps } from './blockStyles';

export default function ProductCarouselTabs({ block }) {
  const tabs = block.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const currentTab = tabs[activeTab] || tabs[0] || { source: 'featured' };
  const tabActiveColor = block.tabActiveColor || block.primaryColor || '#0F604B';
  const cardProps = getCardStyleProps(block);

  const { data: products = [], isLoading } = useBlockProducts(currentTab.source, {
    categoryId: currentTab.categoryId,
    limit: block.productLimit || 10,
  });

  const { data: badges = [] } = useBlockBadges(block.badgeIds || [], block.showBadges !== false);

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
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [products, updateScrollState]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector('[data-card]')?.offsetWidth || 220;
    scrollRef.current.scrollBy({ left: dir * (cardWidth + 16) * 2, behavior: 'smooth' });
  };

  return (
    <BlockWrapper block={block}>
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={i === activeTab
                ? { backgroundColor: tabActiveColor, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              {tab.label || 'Tab'}
            </button>
          ))}
        </div>
      )}

      {/* Carousel */}
      <div className="relative group">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-[220px] flex-shrink-0 bg-gray-100 rounded-xl animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`.carousel-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              {products.map(product => (
                <div key={product._id} data-card className="w-[220px] flex-shrink-0" style={{ height: cardProps.cardEqualHeight ? 'auto' : undefined }}>
                  <ProductCard
                    product={product}
                    showAddToCart={block.showAddToCart !== false}
                    showWishlist={block.showWishlist !== false}
                    showRating={block.showRating !== false}
                    badges={badges}
                    {...cardProps}
                  />
                </div>
              ))}
            </div>
            {/* Scroll arrows */}
            {canScrollLeft && (
              <button
                onClick={() => scroll(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:scale-110"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">No products found</div>
        )}
      </div>
    </BlockWrapper>
  );
}
