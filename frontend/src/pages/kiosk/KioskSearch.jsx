import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI, categoriesAPI } from '@/services/api';
import KioskHeader from '@/components/kiosk/KioskHeader';
import VirtualKeyboard from '@/components/kiosk/VirtualKeyboard';
import { useCurrencyStore } from '@/store';
import { IoSearchOutline, IoCloseCircle, IoArrowForwardOutline } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function KioskSearch() {
  const navigate = useNavigate();
  const { formatPrice } = useCurrencyStore();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  // 300ms debounce — match the web app's SearchBar
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const enabled = debouncedQ.length >= 2;

  // Quick-pick: top 5 products for the live dropdown
  const { data: pickData, isFetching: pickFetching } = useQuery(
    ['kiosk-search-pick', debouncedQ],
    () => productsAPI.getAll({ search: debouncedQ, limit: 5, status: 'active' }),
    { enabled, keepPreviousData: true, refetchOnWindowFocus: false }
  );

  // Matching categories — same approach as web SearchBar (client-side filter)
  const { data: catData } = useQuery(
    ['kiosk-search-categories', debouncedQ],
    () => categoriesAPI.getAll({ search: debouncedQ }),
    { enabled, keepPreviousData: true, refetchOnWindowFocus: false }
  );

  // Full grid: bigger result set
  const { data: fullData, isFetching: fullFetching } = useQuery(
    ['kiosk-search-full', debouncedQ],
    () => productsAPI.getAll({ search: debouncedQ, limit: 24, status: 'active' }),
    { enabled, keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const pickProducts = useMemo(() => pickData?.data?.data || [], [pickData]);
  const matchingCategories = useMemo(() => {
    const all = catData?.data?.data || [];
    const needle = debouncedQ.toLowerCase();
    return all.filter(c => c.name?.toLowerCase().includes(needle)).slice(0, 4);
  }, [catData, debouncedQ]);
  const fullResults = useMemo(() => fullData?.data?.data || [], [fullData]);

  const showDropdown = enabled && (pickProducts.length > 0 || matchingCategories.length > 0 || pickFetching);

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)] gap-6 items-start">
          {/* Left: search input + dropdown + grid */}
          <div className="min-h-[400px]">
            <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 mb-4 relative">
              <div className="flex items-center gap-3 border-b-2 border-primary pb-3">
                <IoSearchOutline size={32} className="text-primary" />
                <input
                  readOnly
                  value={q}
                  placeholder="Type to search products and categories"
                  className="flex-1 text-3xl md:text-4xl font-medium bg-transparent outline-none placeholder:text-gray-300"
                />
                {q && (
                  <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600">
                    <IoCloseCircle size={32} />
                  </button>
                )}
              </div>

              {/* Live dropdown — same shape as website's SearchBar */}
              {showDropdown && (
                <div className="absolute left-5 right-5 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 max-h-[60vh] overflow-y-auto kiosk-scroll">
                  {pickFetching && pickProducts.length === 0 && matchingCategories.length === 0 && (
                    <div className="flex items-center justify-center py-6 text-gray-500">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                      Searching…
                    </div>
                  )}

                  {matchingCategories.length > 0 && (
                    <div className="border-b border-gray-100">
                      <div className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Categories
                      </div>
                      {matchingCategories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => navigate(`/kiosk/shop/${cat.slug || cat._id}`)}
                          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          {cat.iconImage || cat.image ? (
                            <img src={resolveUrl(cat.iconImage || cat.image)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {cat.name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-gray-900 truncate">{cat.name}</div>
                            {cat.productCount > 0 && (
                              <div className="text-xs text-gray-500">{cat.productCount} products</div>
                            )}
                          </div>
                          <IoArrowForwardOutline size={18} className="text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {pickProducts.length > 0 && (
                    <div>
                      <div className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                        Top matches
                      </div>
                      {pickProducts.map((p) => {
                        const price = p.salePrice || p.regularPrice || 0;
                        const onSale = p.salePrice && p.regularPrice && p.salePrice < p.regularPrice;
                        return (
                          <button
                            key={p._id}
                            onClick={() => navigate(`/kiosk/product/${p.slug || p._id}`)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
                              {p.featuredImage && (
                                <img src={resolveUrl(p.featuredImage)} alt={p.name} className="max-w-full max-h-full object-contain" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-semibold text-gray-900 truncate">{p.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm font-bold text-primary">{formatPrice(price)}</span>
                                {onSale && <span className="text-xs text-gray-400 line-through">{formatPrice(p.regularPrice)}</span>}
                              </div>
                            </div>
                            <IoArrowForwardOutline size={18} className="text-gray-300 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Full results grid */}
            {!enabled && (
              <div className="text-center text-gray-400 py-20 text-lg">
                Type at least 2 characters to search
              </div>
            )}
            {enabled && fullFetching && fullResults.length === 0 && (
              <div className="text-center text-gray-500 py-20">Searching…</div>
            )}
            {enabled && !fullFetching && fullResults.length === 0 && (
              <div className="text-center text-gray-500 py-20">No matches for "{debouncedQ}"</div>
            )}
            {fullResults.length > 0 && (
              <>
                <div className="text-sm text-gray-500 mb-3 px-1">
                  Showing {fullResults.length} result{fullResults.length === 1 ? '' : 's'} for "{debouncedQ}"
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fullResults.map(p => {
                    const onSale = p.salePrice && p.regularPrice && p.salePrice < p.regularPrice;
                    return (
                      <button
                        key={p._id}
                        onClick={() => navigate(`/kiosk/product/${p.slug || p._id}`)}
                        className="kiosk-tile bg-white rounded-2xl shadow-sm overflow-hidden text-left"
                      >
                        <div className="h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-3">
                          {p.featuredImage && <img src={resolveUrl(p.featuredImage)} alt={p.name} className="max-w-full max-h-full object-contain" />}
                        </div>
                        <div className="p-3">
                          <div className="text-base font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</div>
                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span className="text-primary font-bold">{formatPrice(p.salePrice || p.regularPrice || 0)}</span>
                            {onSale && <span className="text-xs text-gray-400 line-through">{formatPrice(p.regularPrice)}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right: sticky on-screen keyboard */}
          <div className="lg:sticky lg:top-24 self-start">
            <VirtualKeyboard value={q} onChange={setQ} />
          </div>
        </div>
      </main>
    </div>
  );
}
