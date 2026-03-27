import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { calculateB2BPrice, getDisplayPrice } from '@/utils/pricing';

/**
 * Hook to get B2B pricing for a product
 * @param {Object} product - Product object
 * @param {String} variationId - Variation ID (optional)
 * @param {Number} quantity - Quantity (default: 1)
 * @returns {Object} - { pricing, displayPrice, isLoading }
 */
export function useB2BPricing(product, variationId = null, quantity = 1) {
  const { user } = useAuthStore();
  const isB2BUser = !!(user?.customerGroup || user?.b2bEnabled);
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!product?._id || !isB2BUser) {
      setPricing(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    calculateB2BPrice({
      productId: product._id,
      variationId,
      customerId: user?._id,
      quantity
    })
      .then((result) => {
        setPricing(result);
      })
      .catch(() => {
        setPricing(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [product?._id, variationId, quantity, user?._id, isB2BUser]);

  const displayPrice = getDisplayPrice(product, pricing);

  return {
    pricing,
    displayPrice,
    isLoading
  };
}
