import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { productsAPI } from '@/services/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import FilterSidebar from '@/components/shop/FilterSidebar';
import ProductGrid from '@/components/shop/ProductGrid';
import { SortDropdown, ViewToggle } from '@/components/shop/ShopControls';
import Pagination from '@/components/common/Pagination';
import { IoFilter, IoClose } from 'react-icons/io5';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import PageRenderer from '@/components/pagebuilder/PageRenderer';

export default function ShopPage() {
  const { components: templateComponents, hasTemplate } = usePageTemplate('shop');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [layout, setLayout] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const limit = 12;

  // Build query params
  const queryParams = {
    page,
    limit,
    sort: sortBy,
    ...filters,
    search: searchParams.get('search') || undefined,
  };

  const { data, isLoading } = useQuery(
    ['products', queryParams],
    () => productsAPI.getAll(queryParams)
  );

  const products = data?.data?.products || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const totalProducts = data?.data?.pagination?.total || 0;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = Object.values(filters).flat().length;

  // If a published shop template exists, render it via page builder
  if (hasTemplate && templateComponents) {
    return <PageRenderer components={templateComponents} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Shop', href: '/shop' }
          ]} 
        />

        {/* Page Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {searchParams.get('search') 
              ? `Search Results for "${searchParams.get('search')}"`
              : 'All Products'}
          </h1>
          <p className="text-gray-600 mt-2">
            Showing {products.length} of {totalProducts} products
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <FilterSidebar 
                filters={filters} 
                setFilters={setFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white border-2 border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Filter Button (Mobile) + Results Count */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-600"
                  >
                    <IoFilter />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="bg-secondary text-black px-2 py-0.5 text-xs font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  <span className="hidden sm:inline text-gray-600">
                    {((page - 1) * limit) + 1}–{Math.min(page * limit, totalProducts)} of {totalProducts} results
                  </span>
                </div>

                {/* Right: Sort + View Toggle */}
                <div className="flex items-center gap-3">
                  <SortDropdown value={sortBy} onChange={setSortBy} />
                  <ViewToggle value={layout} onChange={setLayout} />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid 
              products={products} 
              isLoading={isLoading}
              layout={layout}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showing={{
                  from: ((page - 1) * limit) + 1,
                  to: Math.min(page * limit, totalProducts),
                  total: totalProducts
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sidebar */}
      {mobileFiltersOpen && (
        <FilterSidebar 
          filters={filters} 
          setFilters={setFilters}
          onClose={() => setMobileFiltersOpen(false)}
          isMobile
        />
      )}
    </div>
  );
}
