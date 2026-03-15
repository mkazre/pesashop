import { useState, useRef, useEffect, useCallback } from 'react';
import { IoSearch, IoClose, IoArrowForward } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function getImageSrc(path) {
  if (!path) return '/placeholder.jpg';
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export default function SearchBar({ onClose, className = '', inputClassName = '', variant = 'header' }) {
  const { formatPrice } = useCurrencyStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { // Backend $text needs 3+ but categories filter is client-side
      setResults({ products: [], categories: [] });
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getAll({ search: q.trim(), limit: 6 }),
        categoriesAPI.getAll({ search: q.trim() }),
      ]);

      const products = prodRes?.data?.data || [];
      const allCats = catRes?.data?.data || [];
      // Filter categories client-side if backend doesn't support search param
      const categories = allCats.filter(c =>
        c.name?.toLowerCase().includes(q.trim().toLowerCase())
      ).slice(0, 4);

      setResults({ products, categories });
      setOpen(products.length > 0 || categories.length > 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults({ products: [], categories: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setOpen(false);
      onClose?.();
    }
  };

  const handleResultClick = () => {
    setQuery('');
    setOpen(false);
    onClose?.();
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ products: [], categories: [] });
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { if (results.products.length > 0 || results.categories.length > 0) setOpen(true); }}
            placeholder="Search products, categories..."
            className={inputClassName || 'w-full pl-4 pr-20 py-3 border-2 border-gray-300 focus:border-primary focus:outline-none transition-colors'}
            autoComplete="off"
          />
          <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
            {query && (
              <button type="button" onClick={clearSearch} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <IoClose size={18} />
              </button>
            )}
            <button type="submit" className="h-[calc(100%-6px)] px-5 bg-primary text-white hover:bg-primary/90 transition-colors flex items-center">
              <IoSearch size={20} />
            </button>
          </div>
        </div>
      </form>

      {/* Live Results Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          )}

          {!loading && results.categories.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                Categories
              </div>
              {results.categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/shop/${cat.slug}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {cat.iconImage ? (
                    <img src={getImageSrc(cat.iconImage)} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {cat.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{cat.name}</div>
                    {cat.productCount > 0 && (
                      <div className="text-xs text-gray-400">{cat.productCount} products</div>
                    )}
                  </div>
                  <IoArrowForward size={14} className="text-gray-300" />
                </Link>
              ))}
            </div>
          )}

          {!loading && results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                Products
              </div>
              {results.products.map((product) => {
                const price = product.salePrice || product.regularPrice;
                const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
                return (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug || product._id}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={getImageSrc(product.featuredImage || product.images?.[0])}
                      alt={product.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-primary">{formatPrice(price)}</span>
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.regularPrice)}</span>
                        )}
                      </div>
                    </div>
                    <IoArrowForward size={14} className="text-gray-300 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && results.products.length === 0 && results.categories.length === 0 && query.length >= 2 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-500">No results for "<strong>{query}</strong>"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* View All Results */}
          {!loading && (results.products.length > 0 || results.categories.length > 0) && (
            <button
              onClick={() => { handleSubmit({ preventDefault: () => {} }); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-gray-100"
            >
              View all results for "{query}"
              <IoArrowForward size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
