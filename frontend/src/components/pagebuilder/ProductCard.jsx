import React from 'react';
import { Link } from 'react-router-dom';
import StoreProductCard from '@/components/common/ProductCard';

/** View-only ProductCard for page builder - renders placeholder or real product if productId passed */
export const ProductCard = ({ productId, product, className = '' }) => {
  if (product && typeof product === 'object') {
    return (
      <div className={className}>
        <StoreProductCard product={product} />
      </div>
    );
  }
  if (productId) {
    return (
      <div className={`border border-gray-200 rounded p-4 ${className}`}>
        <div className="animate-pulse h-40 bg-gray-100 rounded mb-3" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }
  return (
    <div className={`border border-dashed border-gray-300 rounded p-4 text-center text-gray-500 text-sm ${className}`}>
      Product card
    </div>
  );
};

ProductCard.craft = { displayName: 'ProductCard' };
