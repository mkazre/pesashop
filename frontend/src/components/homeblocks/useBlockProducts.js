import { useQuery } from 'react-query';
import { productsAPI } from '../../services/api';

/**
 * Fetch products by source type for home page blocks.
 * Sources: all, featured, sale, newest, best-selling, top-rated, trending, category
 */
export function useBlockProducts(source, { categoryId = '', limit = 10, enabled = true } = {}) {
  return useQuery(
    ['blockProducts', source, categoryId, limit],
    async () => {
      const params = { limit };

      switch (source) {
        case 'featured':
          params.featured = 'true';
          break;
        case 'sale':
          params.onSale = 'true';
          break;
        case 'newest':
          params.sort = '-createdAt';
          break;
        case 'best-selling':
          params.sort = '-salesCount';
          break;
        case 'top-rated':
          params.sort = '-averageRating';
          break;
        case 'trending':
          params.sort = '-viewCount';
          break;
        case 'category':
          if (categoryId) params.category = categoryId;
          break;
        case 'all':
        default:
          break;
      }

      const res = await productsAPI.getAll(params);
      return res.data?.data?.products || res.data?.data || res.data?.products || [];
    },
    {
      enabled,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );
}
