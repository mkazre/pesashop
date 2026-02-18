import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { pageTemplatesAPI, productsAPI, categoriesAPI } from '@/services/api';
import Loading from '@/components/common/Loading';
import ProductCard from '@/components/common/ProductCard';
import PageRenderer from '@/components/pagebuilder/PageRenderer';
import { Link } from 'react-router-dom';
import { IoChevronForward } from 'react-icons/io5';

// Error boundary so a broken page builder doesn't loop or crash the app
class HomePageBuilderErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('[HomePage] Page builder render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function HomePageBuilderContent({ components }) {
  return (
    <HomePageBuilderErrorBoundary fallback={null}>
      <PageRenderer components={components} />
    </HomePageBuilderErrorBoundary>
  );
}

export default function HomePage() {
  // Fetch homepage from page builder (page with isHomepage or slug home/homepage)
  const { data: homepageResponse, isLoading: pageLoading, isError: homepageError } = useQuery(
    'homepage',
    () => pageTemplatesAPI.getHomepage(),
    {
      retry: false,
      staleTime: 10 * 60 * 1000, // 10 min - avoid refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const homepage = homepageResponse?.data?.data;
  const rawComponents = homepage?.components;
  const parsedComponents = useMemo(() => {
    if (!rawComponents) return null;
    if (typeof rawComponents === 'object' && rawComponents !== null && !Array.isArray(rawComponents)) return rawComponents;
    if (typeof rawComponents === 'string') {
      try {
        return JSON.parse(rawComponents);
      } catch {
        return null;
      }
    }
    return null;
  }, [rawComponents]);
  const hasBuilderContent =
    !homepageError &&
    parsedComponents &&
    typeof parsedComponents === 'object' &&
    Object.keys(parsedComponents).length > 0;

  // Stable reference for page builder so Craft.js doesn't re-mount every render
  const builderComponents = useMemo(
    () => (hasBuilderContent ? parsedComponents : null),
    [hasBuilderContent, parsedComponents]
  );

  // If a published homepage from the page builder exists, render it
  // Only show loading when we're actually fetching and don't have error (avoid blocking on 404)
  if (pageLoading && !homepageError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (hasBuilderContent && builderComponents) {
    return (
      <div className="bg-white">
        <PageRenderer components={builderComponents} />
      </div>
    );
  }

  // No page builder content: show fallback homepage with featured products, new arrivals, categories
  return (
    <HomePageFallback />
  );
}

// Fallback when no page builder homepage is published – featured products, new arrivals, categories
function HomePageFallback() {
  const { data: featuredResponse } = useQuery(
    'featured-products',
    () => productsAPI.getFeatured(),
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: newArrivalsResponse } = useQuery(
    'new-arrivals',
    () => productsAPI.getNew(),
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: categoriesResponse } = useQuery(
    'categories-home',
    () => categoriesAPI.getAll(),
    { staleTime: 5 * 60 * 1000 }
  );

  const featuredProducts = featuredResponse?.data?.data ?? [];
  const newArrivals = newArrivalsResponse?.data?.data ?? [];
  const categories = categoriesResponse?.data?.data?.slice(0, 8) ?? [];

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to our store</h1>
          <p className="text-lg text-gray-600 mb-8">Discover our featured products and new arrivals.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Shop now
            <IoChevronForward className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-12 px-4 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/shop?category=${cat.slug || cat._id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-gray-50 transition-colors text-center"
                >
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="py-12 px-4 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured products</h2>
              <Link to="/shop?featured=true" className="text-primary-600 hover:underline flex items-center gap-1">
                View all <IoChevronForward className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New arrivals</h2>
              <Link to="/shop" className="text-primary-600 hover:underline flex items-center gap-1">
                View all <IoChevronForward className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length === 0 && newArrivals.length === 0 && categories.length === 0 && (
        <div className="py-16 px-4 text-center text-gray-500">
          <p className="text-lg">No content for this page yet.</p>
          <p className="text-sm mt-2">Use the Page Builder in the admin to design the homepage, or add products and categories.</p>
        </div>
      )}
    </div>
  );
}
