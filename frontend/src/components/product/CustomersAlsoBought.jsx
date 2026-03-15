import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { statsAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '/placeholder.jpg';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function CustomersAlsoBought({ productId }) {
  const { formatPrice } = useCurrencyStore();

  const { data, isLoading } = useQuery(
    ['also-bought', productId],
    () => statsAPI.getAlsoBought(productId, { limit: 8 }),
    { enabled: !!productId, staleTime: 5 * 60 * 1000 }
  );

  const products = useMemo(() => {
    const d = data?.data?.data;
    return Array.isArray(d) ? d : [];
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-48 flex-shrink-0 animate-pulse">
            <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin" style={{ width: '100%', minWidth: 0 }}>
      {products.map(product => {
        const price = product.salePrice || product.regularPrice;
        const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
        const discount = hasDiscount ? Math.round((1 - product.salePrice / product.regularPrice) * 100) : 0;

        return (
          <Link
            key={product._id}
            to={`/product/${product.slug || product._id}`}
            className="group flex-shrink-0 w-44 md:w-48"
          >
            <div className="relative bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {hasDiscount && (
                <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  -{discount}%
                </span>
              )}
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center p-2">
                <img
                  src={getImg(product.featuredImage || product.images?.[0])}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(price)}</span>
                  {hasDiscount && (
                    <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.regularPrice)}</span>
                  )}
                </div>
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-[10px] text-gray-500">{product.rating.toFixed(1)} ({product.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
