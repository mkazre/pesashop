import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import KioskHeader from '@/components/kiosk/KioskHeader';
import VirtualKeyboard from '@/components/kiosk/VirtualKeyboard';
import { useCurrencyStore } from '@/store';
import { IoSearchOutline, IoCloseCircle } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function KioskSearch() {
  const navigate = useNavigate();
  const { formatPrice } = useCurrencyStore();
  const [q, setQ] = useState('');

  const trimmed = q.trim();
  const enabled = trimmed.length >= 2;

  const { data, isFetching } = useQuery(
    ['kiosk-search', trimmed],
    () => productsAPI.getAll({ search: trimmed, limit: 24, status: 'active' }),
    { enabled, keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const results = useMemo(() => data?.data?.data || [], [data]);

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 mb-6">
          <div className="flex items-center gap-3 border-b-2 border-primary pb-3">
            <IoSearchOutline size={32} className="text-primary" />
            <input
              readOnly
              value={q}
              placeholder="Type to search products"
              className="flex-1 text-3xl md:text-4xl font-medium bg-transparent outline-none placeholder:text-gray-300"
            />
            {q && (
              <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600">
                <IoCloseCircle size={32} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)] gap-6">
          {/* Results */}
          <div className="min-h-[400px]">
            {!enabled && (
              <div className="text-center text-gray-400 py-20 text-lg">
                Type at least 2 characters to search
              </div>
            )}
            {enabled && isFetching && results.length === 0 && (
              <div className="text-center text-gray-500 py-20">Searching…</div>
            )}
            {enabled && !isFetching && results.length === 0 && (
              <div className="text-center text-gray-500 py-20">No matches for "{trimmed}"</div>
            )}
            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map(p => (
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
                      <div className="mt-1.5 text-primary font-bold">{formatPrice(p.salePrice || p.regularPrice || 0)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard */}
          <div>
            <VirtualKeyboard value={q} onChange={setQ} />
          </div>
        </div>
      </main>
    </div>
  );
}
