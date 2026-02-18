import React from 'react';
import { useNode } from '@craftjs/core';
import { ShoppingCart } from 'lucide-react';

export const ProductCard = ({ 
  productId = null,
  product = null, // For preview/static mode
  layout = 'default',
  showImage = true,
  showTitle = true,
  showPrice = true,
  showButton = true,
  className = '',
  style = {}
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  // Use provided product or fetch from productId (will be handled in dynamic mode)
  const displayProduct = product || {
    name: 'Product Name',
    regularPrice: 99.99,
    salePrice: null,
    featuredImage: '',
    slug: '#',
  };

  const imageUrl = displayProduct.featuredImage || displayProduct.images?.[0] || '';
  const price = displayProduct.salePrice || displayProduct.regularPrice || 0;
  const hasSale = displayProduct.salePrice && displayProduct.salePrice < displayProduct.regularPrice;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`product-card ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''} border border-gray-200 rounded-lg overflow-hidden`}
      style={style}
    >
      {showImage && (
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayProduct.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="opacity-50" />
            </div>
          )}
          {hasSale && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </span>
          )}
        </div>
      )}
      
      <div className="p-4">
        {showTitle && (
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {displayProduct.name}
          </h3>
        )}
        
        {showPrice && (
          <div className="mb-3">
            {hasSale ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-600">
                  R {price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  R {displayProduct.regularPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold">
                R {price.toFixed(2)}
              </span>
            )}
          </div>
        )}
        
        {showButton && (
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

ProductCard.craft = {
  displayName: 'Product Card',
  props: {
    productId: null,
    product: null,
    layout: 'default',
    showImage: true,
    showTitle: true,
    showPrice: true,
    showButton: true,
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
