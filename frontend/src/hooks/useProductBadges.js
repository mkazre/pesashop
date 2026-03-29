import { useQuery } from 'react-query';
import { badgesAPI } from '@/services/api';

/**
 * Bulk-evaluate badges for a list of products.
 * Returns a map: { [productId]: Badge[] }
 */
export function useProductBadges(products = [], enabled = true) {
  const productIds = (Array.isArray(products) ? products : []).map(p => p._id).filter(Boolean);
  const idsKey = productIds.join(',');

  return useQuery(
    ['productBadges', idsKey],
    async () => {
      if (!productIds.length) return {};
      try {
        const res = await badgesAPI.evaluateProducts(productIds);
        return res.data?.data || {};
      } catch {
        return {};
      }
    },
    {
      enabled: enabled && productIds.length > 0,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      placeholderData: {},
    }
  );
}

/**
 * Evaluate badges for a single product.
 * Returns Badge[]
 */
export function useSingleProductBadges(productId, enabled = true) {
  return useQuery(
    ['productBadges', productId],
    async () => {
      if (!productId) return [];
      try {
        const res = await badgesAPI.evaluateProduct(productId);
        const data = res.data?.data;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    {
      enabled: enabled && !!productId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      placeholderData: [],
    }
  );
}
