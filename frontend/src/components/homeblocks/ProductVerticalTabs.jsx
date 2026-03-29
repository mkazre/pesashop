import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';
import { useBlockProducts } from './useBlockProducts';

function MiniProductCard({ product, block, resolveImg }) {
  const horizontal = block.layout !== 'vertical';
  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className={`group flex ${horizontal ? 'flex-row items-center gap-4' : 'flex-col'} p-3 rounded-lg hover:bg-gray-50 transition-colors`}
    >
      {block.showImage !== false && product.images?.[0] && (
        <div className={`flex-shrink-0 ${horizontal ? 'w-16 h-16' : 'w-full h-32'} rounded-lg overflow-hidden bg-gray-50`}>
          <img
            src={resolveImg(product.images[0])}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {product.name}
        </h5>
        {block.showRating !== false && product.averageRating > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${i < Math.round(product.averageRating) ? 'text-amber-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}
        {block.showPrice !== false && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold" style={{ color: block.priceColor || block.primaryColor || '#0F604B' }}>
              R{(product.salePrice || product.regularPrice || 0).toFixed(2)}
            </span>
            {product.salePrice && product.regularPrice > product.salePrice && (
              <del className="text-xs text-gray-400">R{product.regularPrice.toFixed(2)}</del>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ProductVerticalTabs({ block }) {
  const tabs = block.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = tabs[activeTab] || tabs[0] || { source: 'best-selling' };
  const tabActiveColor = block.tabActiveColor || block.primaryColor || '#0F604B';

  const { data: products = [], isLoading } = useBlockProducts(currentTab.source, {
    categoryId: currentTab.categoryId,
    limit: block.productLimit || 4,
  });

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  return (
    <BlockWrapper block={block}>
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Product list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(block.productLimit || 4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="divide-y">
          {products.map(product => (
            <MiniProductCard
              key={product._id}
              product={product}
              block={block}
              resolveImg={resolveImg}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">No products found</div>
      )}
    </BlockWrapper>
  );
}
