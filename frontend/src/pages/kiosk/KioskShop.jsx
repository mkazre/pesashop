import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI, categoriesAPI } from '@/services/api';
import KioskHeader from '@/components/kiosk/KioskHeader';
import { IoFilterOutline, IoSparklesOutline, IoFlashOutline, IoCubeOutline } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

const SORTS = [
  { id: 'featured', label: 'Featured', icon: IoSparklesOutline, params: { sort: '-isFeatured,-totalSold' } },
  { id: 'newest', label: 'Newest', icon: IoFlashOutline, params: { sort: '-createdAt' } },
  { id: 'price-low', label: 'Price ↑', icon: IoCubeOutline, params: { sort: 'regularPrice' } },
  { id: 'price-high', label: 'Price ↓', icon: IoCubeOutline, params: { sort: '-regularPrice' } },
];

export default function KioskShop() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();
  const [sortId, setSortId] = useState('featured');

  const { data: catData } = useQuery(
    ['kiosk-category', categorySlug],
    () => categoriesAPI.getBySlug(categorySlug),
    { enabled: !!categorySlug, refetchOnWindowFocus: false }
  );
  const category = catData?.data?.data;

  const sortParams = useMemo(() => SORTS.find(s => s.id === sortId)?.params || {}, [sortId]);

  const { data, isLoading } = useQuery(
    ['kiosk-shop-products', categorySlug, sortId],
    () => productsAPI.getAll({
      ...(category ? { category: category._id } : {}),
      ...sortParams,
      limit: 60,
      status: 'active',
    }),
    { keepPreviousData: true, refetchOnWindowFocus: false, enabled: !categorySlug || !!category }
  );

  const products = data?.data?.data || [];

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
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-2 inline-flex items-center gap-1"><IoFilterOutline /> Sort:</span>
            {SORTS.map(s => (
              <button
                key={s.id}
                onClick={() => setSortId(s.id)}
                className={`kiosk-tile px-4 py-2.5 rounded-xl font-medium text-sm transition ${sortId === s.id ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl">No products available.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map(p => {
              const onSale = p.salePrice && p.salePrice < p.regularPrice;
              return (
                <button
                  key={p._id}
                  onClick={() => navigate(`/kiosk/product/${p.slug || p._id}`)}
                  className="kiosk-tile bg-white rounded-2xl shadow-sm overflow-hidden text-left flex flex-col"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {p.featuredImage && (
                      <img src={resolveUrl(p.featuredImage)} alt={p.name} className="w-full h-full object-cover" />
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
                      <span className="text-primary font-bold text-lg">R{(p.salePrice || p.regularPrice || 0).toFixed(2)}</span>
                      {onSale && <span className="text-gray-400 text-sm line-through">R{p.regularPrice.toFixed(2)}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
