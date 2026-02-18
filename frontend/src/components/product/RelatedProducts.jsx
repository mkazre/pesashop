import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import ProductCard from '../common/ProductCard';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Loading from '../common/Loading';

export default function RelatedProducts({ productId, categoryId }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading } = useQuery(
    ['relatedProducts', categoryId],
    () => productsAPI.getAll({ category: categoryId, limit: 8 }),
    { enabled: !!categoryId }
  );

  const products = data?.data?.products?.filter(p => p._id !== productId) || [];
  const itemsPerPage = 4;
  const maxIndex = Math.max(0, products.length - itemsPerPage);

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  if (isLoading) {
    return <Loading />;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Related Products</h2>
        {products.length > itemsPerPage && (
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoChevronBack />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IoChevronForward />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`
          }}
        >
          {products.map((product) => (
            <div
              key={product._id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / itemsPerPage}%` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
