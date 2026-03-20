import { useQuery } from 'react-query';
import { badgesAPI } from '@/services/api';

/**
 * Bulk-evaluate badges for a list of products.
 * Returns a map: { [productId]: Badge[] }
 */
export function useProductBadges(products = [], enabled = true) {
  const productIds = products.map(p => p._id).filter(Boolean);
  const idsKey = productIds.join(',');

  return useQuery(
    ['productBadges', idsKey],
    async () => {
      if (!productIds.length) return {};
      const res = await badgesAPI.evaluateProducts(productIds);
      return res.data?.data || {};
    },
    {
      enabled: enabled && productIds.length > 0,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
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
      const res = await badgesAPI.evaluateProduct(productId);
      return res.data?.data || [];
    },
    {
      enabled: enabled && !!productId,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );
}
