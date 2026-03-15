import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrencyStore } from '../../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(product) {
  const raw = product.featuredImage || product.images?.[0]?.url || product.images?.[0] || product.image || '';
  if (!raw) return '/placeholder.png';
  if (raw.startsWith('http')) return raw;
  return `${API_URL}${raw.startsWith('/') ? raw : '/' + raw}`;
}

/**
 * Shared product card for home page blocks.
 * Accepts block-level style overrides for clamp, font sizes, colors, badges.
 */
export default function ProductCard({
  product,
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  compact = false,
  // Style overrides from block config
  cardTitleClamp = 2,
  cardTitleSize = '14px',
  cardPriceSize = '16px',
  cardCategorySize = '12px',
  cardEqualHeight = true,
  cardButtonText = 'View Product',
  showSaleBadge = true,
  showPercentOff = true,
  primaryColor = '#0F604B',
  buttonBgColor = '#0F604B',
  buttonTextColor = '#ffffff',
  buttonHoverBgColor = '#0a4a39',
  priceColor = '#0F604B',
  textColor = '',
  badges = [],
  showBadges = true,
}) {
  const { formatPrice } = useCurrencyStore();
  const [btnHovered, setBtnHovered] = useState(false);
  const imgSrc = getImageSrc(product);
  const price = product.salePrice || product.regularPrice || 0;
  const oldPrice = product.salePrice ? product.regularPrice : null;
  const slug = product.slug || product._id;
  const discount = oldPrice ? Math.round((1 - product.salePrice / product.regularPrice) * 100) : 0;
  const categoryName = product.categories?.[0]?.name || product.category?.name || '';

  if (compact) {
    return (
      <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
        <Link to={`/product/${slug}`} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.src = '/placeholder.png'; }} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/product/${slug}`}
            className="font-medium text-gray-800 transition-colors block"
            style={{ fontSize: cardTitleSize, WebkitLineClamp: cardTitleClamp, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', color: textColor || undefined }}
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold" style={{ fontSize: cardPriceSize, color: priceColor }}>{formatPrice(price)}</span>
            {oldPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(oldPrice)}</span>}
          </div>
          {showRating && product.averageRating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3 h-3 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
      style={{ borderColor: btnHovered ? (primaryColor + '40') : undefined, height: cardEqualHeight ? '100%' : undefined }}
    >
      <Link to={`/product/${slug}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { e.target.src = '/placeholder.png'; }} />
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {showPercentOff && discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {showSaleBadge && product.salePrice && (
            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primaryColor }}>
              SALE
            </span>
          )}
          {showBadges && badges.map((badge) => (
            <span
              key={badge._id || badge.name}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: badge.style?.backgroundColor || primaryColor,
                color: badge.style?.textColor || '#fff',
              }}
            >
              {badge.style?.badgeType === 'image' && badge.style?.imageUrl ? (
                <img src={badge.style.imageUrl.startsWith('http') ? badge.style.imageUrl : `${API_URL}${badge.style.imageUrl}`} alt={badge.name} className="h-4 inline-block" />
              ) : (
                badge.name
              )}
            </span>
          ))}
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        {categoryName && (
          <span className="text-gray-400 font-medium" style={{ fontSize: cardCategorySize }}>{categoryName}</span>
        )}
        <Link
          to={`/product/${slug}`}
          className="block mt-1 font-semibold text-gray-800 transition-colors"
          style={{
            fontSize: cardTitleSize,
            display: '-webkit-box',
            WebkitLineClamp: cardTitleClamp,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: textColor || undefined,
            minHeight: cardEqualHeight ? `calc(${cardTitleSize} * 1.4 * ${cardTitleClamp})` : undefined,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
          onMouseLeave={(e) => e.currentTarget.style.color = textColor || ''}
        >
          {product.name}
        </Link>
        {showRating && product.averageRating > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold" style={{ fontSize: cardPriceSize, color: priceColor }}>{formatPrice(price)}</span>
          {oldPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(oldPrice)}</span>}
        </div>
        {/* Spacer to push button to bottom */}
        {cardEqualHeight && <div className="flex-1" />}
        {showAddToCart && (
          <Link
            to={`/product/${slug}`}
            className="mt-2.5 block w-full text-center py-2 text-xs font-semibold rounded-lg border-2 transition-all duration-200"
            style={{
              borderColor: btnHovered ? buttonBgColor : (primaryColor + '30'),
              color: btnHovered ? buttonTextColor : primaryColor,
              backgroundColor: btnHovered ? buttonBgColor : 'transparent',
            }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
          >
            {cardButtonText}
          </Link>
        )}
      </div>
    </div>
  );
}
