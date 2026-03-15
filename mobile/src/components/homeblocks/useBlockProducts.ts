import { useState, useEffect } from "react";
import { productsAPI } from "@/services/api";

/**
 * Fetch products by source type for home page blocks.
 * Sources: all, featured, sale, newest, best-selling, top-rated, trending, category
 */
export function useBlockProducts(
  source: string,
  { categoryId = "", limit = 10, enabled = true } = {}
) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const params: any = { limit };

    switch (source) {
      case "featured":
        params.featured = "true";
        break;
      case "sale":
        params.onSale = "true";
        break;
      case "newest":
        params.sort = "-createdAt";
        break;
      case "best-selling":
        params.sort = "-salesCount";
        break;
      case "top-rated":
        params.sort = "-averageRating";
        break;
      case "trending":
        params.sort = "-viewCount";
        break;
      case "category":
        if (categoryId) params.category = categoryId;
        break;
      case "all":
      default:
        break;
    }

    productsAPI
      .getAll(params)
      .then((res) => {
        if (!cancelled) {
          const products =
            res.data?.data?.products || res.data?.data || res.data?.products || [];
          setData(Array.isArray(products) ? products : []);
        }
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, categoryId, limit, enabled]);

  return { data, isLoading };
}
