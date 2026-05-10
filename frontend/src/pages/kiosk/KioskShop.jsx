import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI, categoriesAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import { useProductArchiveSettings } from '@/hooks/useProductArchiveSettings';
import KioskHeader from '@/components/kiosk/KioskHeader';
import {
  IoFilterOutline, IoChevronBackOutline, IoChevronForwardOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price ↑' },
  { id: 'price-high', label: 'Price ↓' },
  { id: 'best-selling', label: 'Best Selling' },
];

export default function KioskShop() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrencyStore();
  const { settings: archiveSettings } = useProductArchiveSettings();

  // Mirror website defaults from admin archive settings
  const s = archiveSettings || {};
  const tb = s.toolbar || {};
  const paginationType = s.pagination?.type || 'numbered';
  const loadMoreText = s.pagination?.loadMoreText || 'Load More Products';
  const defaultSort = tb.defaultSort || 'featured';
  const defaultPerPage = tb.defaultPerPage || 12;
  const perPageOptions = (tb.perPageOptions && tb.perPageOptions.length) ? tb.perPageOptions : [12, 24, 36, 48];

  const [sortId, setSortId] = useState(defaultSort);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);

  // Reset when filters/category/sort/perPage/paginationType change
  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [categorySlug, sortId, perPage, paginationType]);

  // Sync defaults once settings load
  useEffect(() => { setSortId(defaultSort); }, [defaultSort]);
  useEffect(() => { setPerPage(defaultPerPage); }, [defaultPerPage]);

  const { data: catData } = useQuery(
    ['kiosk-category', categorySlug],
    () => categoriesAPI.getBySlug(categorySlug),
    { enabled: !!categorySlug, refetchOnWindowFocus: false }
  );
  const category = catData?.data?.data;

  const queryParams = useMemo(() => ({
    page,
    limit: perPage,
    sort: sortId,
    status: 'active',
    ...(category ? { categories: [category._id] } : {}),
  }), [page, perPage, sortId, category]);

  const categoryReady = !categorySlug || !!category;

  const { data, isFetching, isLoading } = useQuery(
    ['kiosk-shop-products', queryParams],
    () => productsAPI.getAll(queryParams),
    { keepPreviousData: true, refetchOnWindowFocus: false, enabled: categoryReady }
  );

  const pageProducts = data?.data?.data || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const totalProducts = data?.data?.pagination?.total || 0;
  const hasMore = page < totalPages;

  // Append into accumulated for load-more / infinite-scroll
  useEffect(() => {
    if (paginationType === 'numbered') return;
    if (!pageProducts || pageProducts.length === 0) return;
    setAccumulated((prev) => {
      if (page === 1) return pageProducts;
      const ids = new Set(prev.map(p => p._id));
      const fresh = pageProducts.filter(p => !ids.has(p._id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [pageProducts, page, paginationType]);

  const products = paginationType === 'numbered'
    ? pageProducts
    : (accumulated.length > 0 ? accumulated : pageProducts);

  const loadMore = () => {
    if (!isFetching && hasMore) setPage(p => p + 1);
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (paginationType !== 'infinite-scroll') return undefined;
    if (!hasMore || isFetching) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [paginationType, hasMore, isFetching, page]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (s.pagination?.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showRange = paginationType === 'numbered'
    ? `${totalProducts === 0 ? 0 : ((page - 1) * perPage) + 1}–${Math.min(page * perPage, totalProducts)} of ${totalProducts}`
    : `${products.length} of ${totalProducts}`;

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {category?.name || 'All Products'}
            </h1>
            {category?.description && <p className="text-gray-500 mt-1 max-w-2xl line-clamp-2">{category.description}</p>}
            {totalProducts > 0 && (
              <p className="text-sm text-gray-500 mt-1">Showing {showRange}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1 inline-flex items-center gap-1"><IoFilterOutline /> Sort:</span>
            {SORT_OPTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSortId(s.id)}
                className={`kiosk-tile px-4 py-2.5 rounded-xl font-medium text-sm transition ${sortId === s.id ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-3 mr-1">Per page:</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="kiosk-tile px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium"
            >
              {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl">No products available.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map(p => {
                const onSale = p.salePrice && p.salePrice < p.regularPrice;
                return (
                  <button
                    key={p._id}
                    onClick={() => navigate(`/kiosk/product/${p.slug || p._id}`)}
                    className="kiosk-tile bg-white rounded-2xl shadow-sm overflow-hidden text-left flex flex-col"
                  >
                    <div className="h-48 sm:h-52 md:h-60 lg:h-64 bg-white relative flex items-center justify-center p-3">
                      {p.featuredImage && (
                        <img src={resolveUrl(p.featuredImage)} alt={p.name} className="max-w-full max-h-full object-contain" />
                      )}
                      {onSale && (
                        <span className="absolute top-3 left-3 bg-secondary text-black text-xs font-bold px-2.5 py-1 rounded">SALE</span>
                      )}
                      {p.stock <= 0 && (
                        <span className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded">OUT</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1.5 flex-1">
                      <div className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</div>
                      <div className="mt-auto flex items-baseline gap-2">
                        <span className="text-primary font-bold text-lg">{formatPrice(p.salePrice || p.regularPrice || 0)}</span>
                        {onSale && <span className="text-gray-400 text-sm line-through">{formatPrice(p.regularPrice)}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination — driven by admin archive settings */}
            {paginationType === 'numbered' && totalPages > 1 && (
              <NumberedPagination
                page={page}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            )}

            {paginationType === 'load-more' && hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={isFetching}
                  className="kiosk-tile inline-flex items-center justify-center px-10 py-4 bg-primary text-white rounded-2xl text-lg font-bold shadow-lg disabled:bg-gray-300"
                >
                  {isFetching ? 'Loading…' : loadMoreText}
                </button>
              </div>
            )}

            {paginationType === 'infinite-scroll' && (
              <>
                <div ref={sentinelRef} className="h-10 mt-6" />
                {isFetching && hasMore && (
                  <div className="text-center text-gray-500 py-4">Loading more…</div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function NumberedPagination({ page, totalPages, onChange }) {
  // Compact paginator: first, prev, window of pages around current, next, last
  const window = 2;
  const pages = [];
  const start = Math.max(1, page - window);
  const end = Math.min(totalPages, page + window);
  for (let p = start; p <= end; p++) pages.push(p);
  const showFirst = start > 1;
  const showLast = end < totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="kiosk-tile w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-200 disabled:opacity-30"
      >
        <IoChevronBackOutline size={22} />
      </button>
      {showFirst && (
        <>
          <PageBtn n={1} active={page === 1} onClick={() => onChange(1)} />
          {start > 2 && <span className="px-2 text-gray-400">…</span>}
        </>
      )}
      {pages.map(p => (
        <PageBtn key={p} n={p} active={page === p} onClick={() => onChange(p)} />
      ))}
      {showLast && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">…</span>}
          <PageBtn n={totalPages} active={page === totalPages} onClick={() => onChange(totalPages)} />
        </>
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="kiosk-tile w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-200 disabled:opacity-30"
      >
        <IoChevronForwardOutline size={22} />
      </button>
    </nav>
  );
}

function PageBtn({ n, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`kiosk-tile min-w-[48px] h-12 px-3 rounded-xl text-base font-semibold transition ${active ? 'bg-primary text-white shadow' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
    >
      {n}
    </button>
  );
}
