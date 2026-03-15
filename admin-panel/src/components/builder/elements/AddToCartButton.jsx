import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { ShoppingCart, Check } from 'lucide-react';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const AddToCartButton = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { 
  productId = null,
  quantity = 1,
  text = 'Add to Cart',
  successText = 'Added!',
  className = '',
  style = {}
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    if (!productId) {
      console.warn('Product ID not set');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual add to cart API call
      // await cartAPI.addItem(productId, quantity);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      ref={(ref) => connect(drag(ref))}
      onClick={handleClick}
      disabled={isLoading || !productId}
      className={`add-to-cart-button ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''} ${
        isAdded ? 'bg-green-600' : 'bg-blue-600'
      } text-white py-2 px-4 rounded hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      style={style}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Adding...</span>
        </>
      ) : isAdded ? (
        <>
          <Check size={16} />
          <span>{successText}</span>
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

AddToCartButton.craft = {
  displayName: 'Add to Cart Button',
  props: {
    productId: null,
    quantity: 1,
    text: 'Add to Cart',
    successText: 'Added!',
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
