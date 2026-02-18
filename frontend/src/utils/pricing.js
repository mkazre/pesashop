import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Calculate B2B price for a product
 * @param {Object} options
 * @param {String} options.productId - Product ID
 * @param {String} options.variationId - Variation ID (optional)
 * @param {String} options.customerId - Customer ID (optional, from auth)
 * @param {Number} options.quantity - Quantity (default: 1)
 * @param {Number} options.orderValue - Total order value (default: 0)
 * @returns {Promise<Object>} - { price, originalPrice, discount, etc. }
 */
export async function calculateB2BPrice(options = {}) {
  const { productId, variationId, customerId, quantity = 1, orderValue = 0 } = options;

  if (!productId) {
    return null;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/b2bking/calculate-price`,
      {
        productId,
        variationId,
        customerId,
        quantity,
        orderValue
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    return response.data.data;
  } catch (error) {
    // If pricing service fails, return null to fall back to regular price
    console.warn('B2B pricing calculation failed:', error);
    return null;
  }
}

/**
 * Calculate B2B prices for multiple products (batch)
 * @param {Array} products - Array of { productId, variationId, quantity }
 * @param {String} customerId - Customer ID (optional)
 * @param {Number} orderValue - Total order value
 * @returns {Promise<Array>} - Array of pricing results
 */
export async function calculateBatchB2BPrices(products, customerId = null, orderValue = 0) {
  if (!products || products.length === 0) {
    return [];
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/b2bking/calculate-batch-prices`,
      {
        products: products.map(p => ({
          productId: p.productId || p._id,
          variationId: p.variationId,
          quantity: p.quantity || 1
        })),
        customerId,
        orderValue
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );

    return response.data.data || [];
  } catch (error) {
    console.warn('Batch B2B pricing calculation failed:', error);
    return [];
  }
}

/**
 * Get display price for a product (with B2B pricing if available)
 * @param {Object} product - Product object
 * @param {Object} b2bPricing - B2B pricing result (from calculateB2BPrice)
 * @returns {Object} - { displayPrice, originalPrice, discount, isB2B }
 */
export function getDisplayPrice(product, b2bPricing = null) {
  if (b2bPricing && b2bPricing.price !== undefined) {
    return {
      displayPrice: b2bPricing.price,
      originalPrice: b2bPricing.originalPrice || product.regularPrice,
      salePrice: b2bPricing.salePrice,
      discount: b2bPricing.discount || 0,
      discountAmount: b2bPricing.discountAmount || 0,
      savings: b2bPricing.savings || 0,
      isB2B: true,
      customerGroup: b2bPricing.customerGroup
    };
  }

  // Fall back to regular pricing
  return {
    displayPrice: product.salePrice || product.regularPrice,
    originalPrice: product.regularPrice,
    salePrice: product.salePrice,
    discount: product.salePrice
      ? Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100)
      : 0,
    discountAmount: product.salePrice ? product.regularPrice - product.salePrice : 0,
    savings: product.salePrice ? product.regularPrice - product.salePrice : 0,
    isB2B: false
  };
}
