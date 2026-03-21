import { useQuery } from 'react-query';
import { productsAPI } from '../../services/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Normalize product API response — handles { data: [...] } and { data: { products: [...] } } */
function extractProducts(res) {
  const d = res.data;
  if (!d) return [];
  // { success, data: [ ...products ] }
  if (Array.isArray(d.data)) return d.data;
  // { success, data: { products: [...] } }
  if (d.data?.products && Array.isArray(d.data.products)) return d.data.products;
  // { products: [...] }
  if (Array.isArray(d.products)) return d.products;
  return [];
}

/**
 * Try stats endpoint first; if it returns fewer than `min` unique products
 * (meaning it mostly fell back to generic featured products), return null
 * so the caller can use the products API fallback instead.
 */
async function fetchFromStats(endpoint, limit) {
  try {
    const res = await fetch(`${BASE_URL}/api/stats/${endpoint}?limit=${limit}&days=90`);
    if (!res.ok) return null;
    const json = await res.json();
    const products = json.data || [];
    // Only trust stats data if it returned a meaningful amount
    if (products.length >= Math.min(limit, 2)) return products;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch products by source type for home page blocks.
 * Sources: all, featured, sale, newest, best-selling, top-rated, trending, most-viewed, category
 *
 * Uses stats endpoints (real order/view data) when available, with proper
 * fallbacks to the products API using correct sort params.
 */
export function useBlockProducts(source, { categoryId = '', limit = 10, enabled = true } = {}) {
  return useQuery(
    ['blockProducts', source, categoryId, limit],
    async () => {
      switch (source) {
        case 'trending': {
          // Try real stats data first (orders + views)
          const statsProducts = await fetchFromStats('trending-products', limit);
          if (statsProducts) return statsProducts;
          // Fallback: newest products with high engagement signals
          return extractProducts(await productsAPI.getAll({ sort: 'date-desc', limit }));
        }

        case 'most-viewed': {
          // Try real stats data first (page views, clicks)
          const statsProducts = await fetchFromStats('popular-products', limit);
          if (statsProducts) return statsProducts;
          // Fallback: all products sorted by date (most recently viewed tend to be newest)
          return extractProducts(await productsAPI.getAll({ sort: 'date-desc', featured: 'true', limit }));
        }

        case 'best-selling': {
          // Try real stats data first (order-based trending)
          const statsProducts = await fetchFromStats('trending-products', limit);
          if (statsProducts) return statsProducts;
          // Fallback: featured products (likely best sellers in a new store)
          return extractProducts(await productsAPI.getAll({ featured: 'true', limit }));
        }

        case 'newest':
          return extractProducts(await productsAPI.getAll({ sort: 'date-desc', limit }));

        case 'featured':
          return extractProducts(await productsAPI.getAll({ featured: 'true', limit }));

        case 'sale':
          return extractProducts(await productsAPI.getAll({ onSale: 'true', limit }));

        case 'top-rated':
          return extractProducts(await productsAPI.getAll({ sort: 'rating-desc', limit }));

        case 'category':
          if (categoryId) {
            return extractProducts(await productsAPI.getAll({ category: categoryId, limit }));
          }
          return [];

        case 'all':
        default:
          return extractProducts(await productsAPI.getAll({ limit }));
      }
    },
    {
      enabled,
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    }
  );
}
