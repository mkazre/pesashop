import React from 'react';
import { useNode } from '@craftjs/core';

export const PriceDisplay = ({ 
  productId = null,
  product = null, // For preview/static mode
  showSalePrice = true,
  currency = 'ZAR',
  format = 'R {price}',
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
    regularPrice: 99.99,
    salePrice: null,
  };

  const regularPrice = displayProduct.regularPrice || 0;
  const salePrice = displayProduct.salePrice;
  const hasSale = salePrice && salePrice < regularPrice;
  const displayPrice = hasSale ? salePrice : regularPrice;

  const formatPrice = (price) => {
    return format.replace('{price}', price.toFixed(2));
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`price-display ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      {hasSale && showSalePrice ? (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-red-600">
            {formatPrice(salePrice)}
          </span>
          <span className="text-sm text-gray-500 line-through">
            {formatPrice(regularPrice)}
          </span>
        </div>
      ) : (
        <span className="text-lg font-bold">
          {formatPrice(displayPrice)}
        </span>
      )}
    </div>
  );
};

PriceDisplay.craft = {
  displayName: 'Price Display',
  props: {
    productId: null,
    product: null,
    showSalePrice: true,
    currency: 'ZAR',
    format: 'R {price}',
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
