import React from 'react';
import { Link } from 'react-router-dom';

/** View-only AddToCart for page builder */
export const AddToCartButton = ({ productId, text = 'Add to cart', className = '' }) => {
  if (productId) {
    return (
      <Link
        to={`/product/${productId}`}
        className={`inline-block px-4 py-2 bg-primary text-white rounded hover:opacity-90 ${className}`}
      >
        {text}
      </Link>
    );
  }
  return (
    <span className={`inline-block px-4 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed ${className}`}>
      {text}
    </span>
  );
};

AddToCartButton.craft = { displayName: 'AddToCartButton' };
