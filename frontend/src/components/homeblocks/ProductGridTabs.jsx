import React, { useState } from 'react';
import BlockWrapper from './BlockWrapper';
import ProductCard from './ProductCard';
import { useBlockProducts } from './useBlockProducts';
import { useBlockBadges } from './useBlockBadges';
import { getCardStyleProps } from './blockStyles';

export default function ProductGridTabs({ block }) {
  const tabs = block.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = tabs[activeTab] || tabs[0] || { source: 'all' };
  const tabActiveColor = block.tabActiveColor || block.primaryColor || '#0F604B';
  const cardProps = getCardStyleProps(block);

  const { data: products = [], isLoading } = useBlockProducts(currentTab.source, {
    categoryId: currentTab.categoryId,
    limit: block.productLimit || 10,
  });

  const { data: badges = [] } = useBlockBadges(block.badgeIds || [], block.showBadges !== false);

  const columns = block.productColumns || 5;
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

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

      {/* Product grid */}
      {isLoading ? (
        <div className={`grid ${gridCols} gap-4`}>
          {[...Array(block.productLimit || 10)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className={`grid ${gridCols} gap-4`}>
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              showAddToCart={block.showAddToCart !== false}
              showWishlist={block.showWishlist !== false}
              showRating={block.showRating !== false}
              badges={badges}
              {...cardProps}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No products found</div>
      )}
    </BlockWrapper>
  );
}
