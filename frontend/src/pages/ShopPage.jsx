import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '@/services/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import FilterSidebar from '@/components/shop/FilterSidebar';
import ArchiveProductCard from '@/components/shop/ArchiveProductCard';
import CategoryBanner from '@/components/shop/CategoryBanner';
import CategoryShowcase from '@/components/shop/CategoryShowcase';
import FloatingCompareBar from '@/components/shop/FloatingCompareBar';
import TikTokVideoSlot from '@/components/social/TikTokVideoSlot';
import { SortDropdown, ViewToggle } from '@/components/shop/ShopControls';
import Pagination from '@/components/common/Pagination';
import Loading from '@/components/common/Loading';
import SmartIcon from '@/components/common/SmartIcon';
import { IoFilter, IoClose, IoChevronDown } from 'react-icons/io5';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import { useProductArchiveSettings } from '@/hooks/useProductArchiveSettings';
import { useProductBadges } from '@/hooks/useProductBadges';
import PageRenderer from '@/components/pagebuilder/PageRenderer';

export default function ShopPage() {
  const { components: templateComponents, hasTemplate } = usePageTemplate('shop');
  const { settings: archiveSettings } = useProductArchiveSettings();
  const { category: categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const s = archiveSettings || {};
  const tb = s.toolbar || {};
  const pg = s.productGrid || {};
  const layoutConfig = s.layout || {};
  const paginationType = s.pagination?.type || 'numbered';

  // null = not yet user-set; falls back to settings default until then
  const [layoutOverride, setLayoutOverride] = useState(null);
  const [sortOverride, setSortOverride] = useState(null);
  const [perPageOverride, setPerPageOverride] = useState(null);
  const [page, setPage] = useState(1);

  const layout = layoutOverride ?? tb.defaultView ?? 'grid';
  const sortBy = sortOverride ?? tb.defaultSort ?? 'featured';
  const perPage = perPageOverride ?? tb.defaultPerPage ?? 12;

  const setLayout = (v) => setLayoutOverride(v);
  const setSortBy = (v) => setSortOverride(v);
  const setPerPage = (v) => setPerPageOverride(v);

  // Accumulated products for load-more / infinite-scroll
  const [accumulated, setAccumulated] = useState([]);

  // Reset page + accumulated when filters, category, sort, perPage, or pagination type change
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [filters, categorySlug, sortBy, perPage, paginationType]);

  // Fetch current category data if on category page
  const { data: categoryData } = useQuery(
    ['category', categorySlug],
    () => categoriesAPI.getBySlug(categorySlug),
    { enabled: !!categorySlug, staleTime: 5 * 60 * 1000 }
  );
  const currentCategory = useMemo(() => {
    if (!categoryData) return null;
    const d = categoryData?.data?.data || categoryData?.data;
    if (Array.isArray(d)) return d[0] || null;
    return d || null;
  }, [categoryData]);

  // Build query params
  const queryParams = useMemo(() => ({
    page,
    limit: perPage,
    sort: sortBy,
    ...filters,
    ...(categorySlug ? { categories: [currentCategory?._id].filter(Boolean) } : {}),
    search: searchParams.get('search') || undefined,
  }), [page, perPage, sortBy, filters, categorySlug, currentCategory, searchParams]);

  // Don't fetch products until the category is resolved (if on a category page)
  const categoryReady = !categorySlug || !!currentCategory;

  const { data, isLoading, isFetching } = useQuery(
    ['products', queryParams],
    () => productsAPI.getAll(queryParams),
    { keepPreviousData: true, enabled: categoryReady }
  );

  // API returns { success, count, data: [...products], pagination: { page, limit, total, totalPages } }
  // After axios wraps: response.data = { success, count, data: [...], pagination: {...} }
  const pageProducts = data?.data?.data || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const totalProducts = data?.data?.pagination?.total || 0;

  // Append fetched page into accumulated list (load-more / infinite-scroll modes)
  useEffect(() => {
    if (paginationType === 'numbered') return;
    if (!pageProducts || pageProducts.length === 0) return;
    setAccumulated((prev) => {
      // Replace when on page 1 (filter/sort change), else append
      if (page === 1) return pageProducts;
      // Avoid duplicate append if React re-renders with same data
      const existingIds = new Set(prev.map((p) => p._id));
      const fresh = pageProducts.filter((p) => !existingIds.has(p._id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [pageProducts, page, paginationType]);

  // For non-numbered modes, prefer accumulated; fall back to pageProducts during the
  // brief window after a filter/sort reset clears `accumulated` but before the append effect runs.
  const products = paginationType === 'numbered'
    ? pageProducts
    : (accumulated.length > 0 ? accumulated : pageProducts);
  const hasMore = page < totalPages;

  // Fetch evaluated badges for current product list
  const { data: badgeMap = {} } = useProductBadges(products, products.length > 0);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (s.pagination?.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadMore = () => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  };

  // Infinite scroll — observe sentinel at end of grid
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (paginationType !== 'infinite-scroll') return;
    if (!hasMore || isFetching) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [paginationType, hasMore, isFetching, page]);

  const activeFiltersCount = Object.values(filters).flat().filter(Boolean).length;
  const searchTerm = searchParams.get('search');
  const isShopPage = !categorySlug && !searchTerm;
  const isSearchPage = !!searchTerm;

  // Breadcrumbs
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Shop', href: '/shop' }];
    if (currentCategory) items.push({ label: currentCategory.name });
    if (searchTerm) items.push({ label: `Search: "${searchTerm}"` });
    return items;
  }, [currentCategory, searchTerm]);

  // If a published shop template exists, render it via page builder
  if (hasTemplate && templateComponents) {
    return <PageRenderer components={templateComponents} />;
  }

  // Layout type
  const layoutType = layoutConfig.type || 'sidebar-left';
  const sidebarWidth = layoutConfig.sidebarWidth || '280px';
  const contentGap = (layoutConfig.contentGap || 24) + 'px';
  const showSidebar = (s.sidebar?.enabled !== false) && layoutType !== 'full-width';

  // Grid columns
  const colsDesktop = pg.columnsDesktop || 3;
  const colsTablet = pg.columnsTablet || 2;
  const colsMobile = pg.columnsMobile || 2;
  const gridGap = (pg.gap || 16) + 'px';

  // Responsive grid CSS injected via style tag (Tailwind can't do dynamic grid-cols)
  const gridId = 'archive-product-grid';
  const gridStyle = {
    display: 'grid',
    gap: gridGap,
    gridTemplateColumns: `repeat(${colsMobile}, 1fr)`,
  };
  const responsiveGridCSS = `
    @media (min-width: 640px) { #${gridId} { grid-template-columns: repeat(${colsTablet}, 1fr) !important; } }
    @media (min-width: 1024px) { #${gridId} { grid-template-columns: repeat(${colsDesktop}, 1fr) !important; } }
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6" style={{ maxWidth: layoutConfig.containerMaxWidth || '1400px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Breadcrumbs */}
        {(s.pageHeader?.showBreadcrumbs !== false) && (
          <Breadcrumbs items={breadcrumbItems} />
        )}

        {/* Category Banner / Page Header */}
        <CategoryBanner
          category={currentCategory}
          settings={s}
          totalProducts={totalProducts}
          isShopPage={isShopPage}
        />

        {/* Search term display */}
        {isSearchPage && s.searchResults?.showSearchTerm !== false && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{searchTerm}"
            </h1>
          </div>
        )}

        {/* Category Showcase */}
        {s.categoryShowcase?.enabled !== false && s.categoryShowcase?.showOnShopPage !== false && isShopPage && s.categoryShowcase?.position !== 'in-sidebar' && (
          <CategoryShowcase settings={s} />
        )}

        {/* Main Layout */}
        <div
          className="flex"
          style={{
            gap: contentGap,
            flexDirection: layoutType === 'sidebar-right' ? 'row' : 'row',
          }}
        >
          {/* Sidebar — Left or Right */}
          {showSidebar && layoutType === 'sidebar-left' && (
            <aside className="hidden lg:block flex-shrink-0" style={{ width: sidebarWidth }}>
              <div className={layoutConfig.stickyFilters !== false ? 'sticky top-4' : ''}>
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  settings={s}
                  currentCategoryId={currentCategory?._id}
                />
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            {tb.enabled !== false && (
              <div className="bg-white border border-gray-200 p-3 mb-4 rounded-lg" style={{ background: s.theme?.toolbarBackground || '#ffffff' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Mobile filter + count */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileFiltersOpen(true)}
                      className="lg:hidden flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded transition-colors"
                    >
                      <IoFilter size={16} />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="bg-white/20 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                    {tb.showResultCount !== false && (
                      <span className="hidden sm:inline text-sm text-gray-600">
                        {totalProducts > 0
                          ? (paginationType === 'numbered'
                              ? `${((page - 1) * perPage) + 1}–${Math.min(page * perPage, totalProducts)} of ${totalProducts} products`
                              : `Showing ${products.length} of ${totalProducts} products`)
                          : '0 products'}
                      </span>
                    )}
                  </div>

                  {/* Right: Per page + Sort + View */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {tb.showPerPageSelector !== false && (
                      <div className="relative">
                        <select
                          value={perPage}
                          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                          className="appearance-none bg-white border border-gray-300 rounded px-2 sm:px-4 py-1.5 sm:py-2 pr-7 sm:pr-10 text-xs sm:text-sm focus:border-primary focus:outline-none cursor-pointer"
                        >
                          {(tb.perPageOptions || [12, 24, 36, 48]).map(n => (
                            <option key={n} value={n}>Show {n}</option>
                          ))}
                        </select>
                        <IoChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={12} />
                      </div>
                    )}
                    {tb.showSortDropdown !== false && (
                      <SortDropdown value={sortBy} onChange={setSortBy} />
                    )}
                    {tb.showViewToggle !== false && (
                      <ViewToggle value={layout} onChange={setLayout} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {isLoading ? (
              <Loading text="Loading products..." />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center">
                  <SmartIcon value={s.emptyState?.icon} fallback="🔍" size={56} />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{s.emptyState?.title || 'No products found'}</h3>
                <p className="text-gray-600 mb-4">{s.emptyState?.message || 'Try adjusting your filters or search terms'}</p>
                {s.emptyState?.showClearFiltersButton !== false && activeFiltersCount > 0 && (
                  <button onClick={() => setFilters({})} className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : layout === 'list' ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <ArchiveProductCard key={product._id} product={product} layout="list" settings={s} evaluatedBadges={badgeMap[product._id] || []} />
                ))}
              </div>
            ) : (
              <>
                <style>{responsiveGridCSS}</style>
                <div id={gridId} style={gridStyle}>
                  {products.map((product) => (
                    <ArchiveProductCard key={product._id} product={product} layout="grid" settings={s} evaluatedBadges={badgeMap[product._id] || []} />
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && paginationType === 'numbered' && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  showing={{
                    from: ((page - 1) * perPage) + 1,
                    to: Math.min(page * perPage, totalProducts),
                    total: totalProducts
                  }}
                />
              </div>
            )}

            {/* Load More button */}
            {paginationType === 'load-more' && hasMore && products.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {isFetching ? 'Loading…' : (s.pagination?.loadMoreText || 'Load More Products')}
                </button>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {paginationType === 'infinite-scroll' && hasMore && products.length > 0 && (
              <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
                {isFetching && <Loading text="Loading more..." />}
              </div>
            )}
          </div>

          {/* Sidebar — Right */}
          {showSidebar && layoutType === 'sidebar-right' && (
            <aside className="hidden lg:block flex-shrink-0" style={{ width: sidebarWidth }}>
              <div className={layoutConfig.stickyFilters !== false ? 'sticky top-4' : ''}>
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  settings={s}
                  currentCategoryId={currentCategory?._id}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className={`absolute top-0 ${(s.mobile?.filterDrawerPosition || 'left') === 'right' ? 'right-0' : 'left-0'} bottom-0 w-80 bg-white overflow-y-auto`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                <IoClose size={24} />
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              settings={s}
              currentCategoryId={currentCategory?._id}
              onClose={() => setMobileFiltersOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      {/* TikTok video carousel */}
      {(() => {
        const base = categorySlug ? categorySlug.replace(/-/g, ' ') : '';
        const keywords = base ? [base, `${base} review`] : ['trending', 'deals'];
        return <TikTokVideoSlot keywords={keywords} pageType="shop" />;
      })()}

      {/* Floating Compare Bar */}
      <FloatingCompareBar settings={s} />
    </div>
  );
}
