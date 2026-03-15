import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { categoriesAPI } from '@/services/api';
import { IoArrowForward, IoGridOutline } from 'react-icons/io5';
import Breadcrumbs from '@/components/common/Breadcrumbs';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function CategoriesPage() {
  const { data, isLoading } = useQuery('all-categories', () => categoriesAPI.getAll({ tree: 'true' }), {
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const d = data?.data?.data;
    return Array.isArray(d) ? d.filter(c => c.isActive !== false) : [];
  }, [data]);

  const totalProducts = useMemo(() => categories.reduce((sum, c) => sum + (c.productCount || 0), 0), [categories]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container-custom py-12 md:py-16">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Categories' }]} className="mb-6 text-white/70" />
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <IoGridOutline size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Shop by Category</h1>
              <p className="text-white/80 mt-1">
                Browse {categories.length} categories with {totalProducts.toLocaleString()} products
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container-custom py-10 md:py-14">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No categories yet</h2>
            <p className="text-gray-500">Check back soon — new categories are on the way!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map(category => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ category }) {
  const hasIcon = !!category.iconImage?.url;
  const hasBanner = !!category.bannerImage?.url;
  const bgImage = hasBanner ? getImg(category.bannerImage.url) : null;

  return (
    <Link
      to={`/shop/${category.slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
    >
      {/* Background / Banner area */}
      <div
        className="relative h-36 sm:h-40 flex items-center justify-center overflow-hidden"
        style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {bgImage && <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />}
        {!bgImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors" />
        )}

        {/* Icon */}
        <div className="relative z-10">
          {hasIcon ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <img
                src={getImg(category.iconImage.url)}
                alt={category.iconImage.alt || category.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <span className="text-3xl sm:text-4xl font-bold text-primary/60">
                {category.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 text-sm sm:text-base">
          {category.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {category.productCount || 0} {category.productCount === 1 ? 'product' : 'products'}
        </p>
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Browse <IoArrowForward size={12} />
        </div>
      </div>

      {/* Children count badge */}
      {category.children?.length > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2 py-1 rounded-full shadow-sm">
          +{category.children.length} sub
        </div>
      )}
    </Link>
  );
}
