import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { digitalKioskAPI, categoriesAPI, productsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoSparklesOutline, IoSaveOutline, IoCloseOutline, IoSearchOutline } from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function FeaturedContentPage() {
  const queryClient = useQueryClient();
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const { data: configData, isLoading } = useQuery('digital-kiosk-config', digitalKioskAPI.getConfig, {
    refetchOnWindowFocus: false,
  });
  const { data: categoriesData } = useQuery('all-categories-flat', () => categoriesAPI.getAll({ limit: 500 }), {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const c = configData?.data?.data;
    if (c) {
      setFeaturedCategories(c.featuredCategories || []);
      setFeaturedProducts(c.featuredProducts || []);
    }
  }, [configData]);

  const allCategories = categoriesData?.data?.data || categoriesData?.data || [];
  const selectedCategoryIds = useMemo(() => new Set(featuredCategories.map(c => String(c._id || c))), [featuredCategories]);

  const saveMutation = useMutation(
    () => digitalKioskAPI.updateConfig({
      featuredCategories: featuredCategories.map(c => c._id || c),
      featuredProducts: featuredProducts.map(p => p._id || p),
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('digital-kiosk-config');
        toast.success('Featured content saved');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
    }
  );

  const toggleCategory = (cat) => {
    if (selectedCategoryIds.has(String(cat._id))) {
      setFeaturedCategories(featuredCategories.filter(c => String(c._id || c) !== String(cat._id)));
    } else {
      setFeaturedCategories([...featuredCategories, cat]);
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IoSparklesOutline size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Featured Content</h1>
            <p className="text-sm text-gray-500">Pick categories and products to highlight on the kiosk home screen</p>
          </div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
          <IoSaveOutline size={18} className="mr-2" />
          {saveMutation.isLoading ? 'Saving…' : 'Save Featured Content'}
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Featured Categories ({featuredCategories.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {allCategories.map(cat => {
              const selected = selectedCategoryIds.has(String(cat._id));
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`relative p-3 border rounded-lg text-left transition ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      <img src={resolveUrl(cat.image)} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{cat.name}</div>
                      <div className="text-xs text-gray-500">{cat.productCount || 0} products</div>
                    </div>
                  </div>
                  {selected && <div className="absolute top-1 right-1 text-xs bg-primary text-white px-1.5 py-0.5 rounded">✓</div>}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Featured Products ({featuredProducts.length})</h2>
          <ProductPicker
            selected={featuredProducts}
            onAdd={(p) => setFeaturedProducts([...featuredProducts, p])}
            onRemove={(id) => setFeaturedProducts(featuredProducts.filter(p => String(p._id || p) !== String(id)))}
          />
        </div>
      </Card>
    </div>
  );
}

function ProductPicker({ selected, onAdd, onRemove }) {
  const [search, setSearch] = useState('');
  const selectedIds = new Set(selected.map(p => String(p._id || p)));

  const { data, isFetching } = useQuery(
    ['kiosk-product-picker', search],
    () => productsAPI.getAll({ search, limit: 30, status: 'active' }),
    { enabled: search.length >= 2, refetchOnWindowFocus: false, keepPreviousData: true }
  );
  const results = data?.data?.data || [];

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <span key={p._id || p} className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm rounded px-2 py-1">
              {p.featuredImage && <img src={resolveUrl(p.featuredImage)} alt="" className="w-6 h-6 rounded object-cover" />}
              <span className="max-w-xs truncate">{p.name || p._id}</span>
              <button onClick={() => onRemove(p._id || p)} className="hover:text-red-600"><IoCloseOutline /></button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add (min 2 chars)"
          className="w-full border rounded pl-10 pr-3 py-2"
        />
      </div>

      {search.length >= 2 && (
        <div className="border rounded max-h-72 overflow-y-auto">
          {isFetching && <div className="p-3 text-sm text-gray-500">Searching…</div>}
          {!isFetching && results.length === 0 && <div className="p-3 text-sm text-gray-500">No products match.</div>}
          {results.map(p => (
            <button
              key={p._id}
              type="button"
              onClick={() => !selectedIds.has(String(p._id)) && onAdd(p)}
              disabled={selectedIds.has(String(p._id))}
              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              {p.featuredImage ? (
                <img src={resolveUrl(p.featuredImage)} alt="" className="w-10 h-10 rounded object-cover" />
              ) : <div className="w-10 h-10 bg-gray-100 rounded" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                <div className="text-xs text-gray-500">R{(p.salePrice || p.regularPrice || 0).toFixed(2)}</div>
              </div>
              {selectedIds.has(String(p._id)) && <span className="text-xs text-primary">Added</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
