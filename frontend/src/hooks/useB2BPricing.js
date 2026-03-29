import { getDisplayPrice } from '@/utils/pricing';

/**
 * Hook to get B2B pricing for a product
 * DISABLED: Now just returns stored regularPrice/salePrice without API call
 * The backend productPriceUpdater already calculates and stores prices
 * @param {Object} product - Product object
 * @param {String} variationId - Variation ID (optional)
 * @param {Number} quantity - Quantity (default: 1)
 * @returns {Object} - { pricing, displayPrice, isLoading }
 */
export function useB2BPricing(product, variationId = null, quantity = 1) {
  // DISABLED: No longer makes API calls to calculate price
  // Prices are already calculated by productPriceUpdater and stored in regularPrice/salePrice
  const displayPrice = getDisplayPrice(product, null);

  return {
    pricing: null,
    displayPrice,
    isLoading: false
  };
}
