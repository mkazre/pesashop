import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { statsAPI } from '@/services/api';
import ProductCarousel from './ProductCarousel';

export default function FrequentlyBoughtTogether({ productId }) {
  const { data, isLoading } = useQuery(
    ['frequently-bought-together', productId],
    () => statsAPI.getFrequentlyBoughtTogether(productId, { limit: 12 }),
    { enabled: !!productId, staleTime: 5 * 60 * 1000 }
  );

  const products = useMemo(() => {
    const d = data?.data?.data;
    return Array.isArray(d) ? d : [];
  }, [data]);

  if (!isLoading && products.length === 0) return null;

  return <ProductCarousel products={products} isLoading={isLoading} />;
}
