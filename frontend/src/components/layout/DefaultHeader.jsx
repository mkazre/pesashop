import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  IoSearch, IoPerson, IoCart, IoHeart,
  IoChevronDown, IoChevronForward, IoMenu, IoClose,
  IoCall, IoLocation, IoGrid,
  IoLogOut, IoReceipt, IoSettings,
  IoArrowForward, IoFlame, IoTrendingUp,
  IoHome, IoStorefront,
} from 'react-icons/io5';
import { useCartStore, useWishlistStore, useAuthStore, useUIStore, useCurrencyStore } from '@/store';
import { useQuery } from 'react-query';
import { menusAPI, categoriesAPI, productsAPI, statsAPI } from '@/services/api';
import CurrencyPicker from '@/components/common/CurrencyPicker';
import SearchBar from '@/components/common/SearchBar';
import NotificationBell from '@/components/common/NotificationBell';
import { useAnalytics } from '@/hooks/useAnalytics';
import pesaLogo from '@/assets/pesashop-logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '/placeholder.jpg';
  if (typeof src === 'object') src = src.url || src.src || '';
  if (!src || typeof src !== 'string') return '/placeholder.jpg';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

// ── Account Flyout ──────────────────────────────────────────────────
const AccountFlyout = ({ user, onClose, onLogout, onNavigate }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* User Info */}
      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
      {/* Links */}
      <div className="py-2">
        {[
          { icon: IoPerson, label: 'My Account', to: '/account' },
          { icon: IoReceipt, label: 'My Orders', to: '/account/orders' },
          { icon: IoHeart, label: 'Wishlist', to: '/wishlist' },
          { icon: IoSettings, label: 'Account Settings', to: '/account/settings' },
        ].map(item => (
          <Link key={item.to} to={item.to} onClick={() => { onClose(); onNavigate?.(); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
            <item.icon size={18} className="text-gray-400" />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="border-t border-gray-100 py-2">
        <button onClick={() => { onLogout(); onClose(); }}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
          <IoLogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ── Category Mega Menu (redesigned) ─────────────────────────────────
const CategoryMegaMenu = ({ categories, onClose, formatPrice }) => {
  // Fetch real stats data for mega menu
  const { data: megaRes } = useQuery('mega-menu-stats', () => statsAPI.getMegaMenuData(), {
    staleTime: 3 * 60 * 1000,
  });
  const megaData = megaRes?.data?.data || {};
  const trending = megaData.trending || [];
  const popular = megaData.popular || [];
  const topSearches = megaData.topSearches || [];

  // If no real stats yet, use fallback from categories data
  const hasTrending = trending.length > 0;

  return (
    <div className="absolute top-full z-50"
      style={{ animation: 'megaSlideDown 0.22s ease-out', left: '50%', transform: 'translateX(-50%)', width: '100vw' }}>
      {/* White background container with shadow - full width solid white */}
      <div style={{ backgroundColor: '#ffffff', borderTop: '2px solid #1b5e35' }}
        className="shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <div className="container-custom py-8">
          <div className="grid grid-cols-12 gap-0">

            {/* ── LEFT: Categories ── */}
            <div className="col-span-5 pr-8 border-r border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <IoGrid size={14} className="text-primary" />
                  Shop by Category
                </h3>
                <Link to="/categories" onClick={onClose}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
                  View All <IoArrowForward size={10} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {categories.slice(0, 12).map(cat => (
                  <Link key={cat._id} to={`/shop/${cat.slug}`} onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all group">
                    {cat.iconImage?.url ? (
                      <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-primary/30 transition-colors">
                        <img src={getImg(cat.iconImage.url)} alt={cat.iconImage.alt || ''} className="w-7 h-7 object-contain" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {cat.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-800 group-hover:text-primary transition-colors truncate">{cat.name}</div>
                      {cat.productCount > 0 && (
                        <div className="text-[10px] text-gray-400 leading-tight">{cat.productCount} items</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── MIDDLE: Trending (most ordered) ── */}
            <div className="col-span-4 px-8 border-r border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <IoFlame size={14} className="text-orange-500" />
                {hasTrending ? 'Best Sellers' : 'Featured'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(hasTrending ? trending : categories.slice(0, 4).flatMap(() => [])).slice(0, 4).map((product, idx) => {
                  const price = product.salePrice || product.regularPrice;
                  const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
                  return (
                    <Link key={product._id || idx} to={`/product/${product.slug || product._id}`} onClick={onClose}
                      className="group">
                      <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square mb-2">
                        <img src={getImg(product.featuredImage || product.images?.[0])} alt={product.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300" />
                        {hasDiscount && (
                          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            SALE
                          </span>
                        )}
                        {idx === 0 && hasTrending && (
                          <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <IoFlame size={8} /> #1
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[13px] font-bold text-gray-900">{formatPrice(price)}</span>
                        {hasDiscount && <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.regularPrice)}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {!hasTrending && (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400">Best sellers will appear here as customers shop</p>
                </div>
              )}
            </div>

            {/* ── RIGHT: Popular + Top Searches ── */}
            <div className="col-span-3 pl-8">
              {/* Popular Products */}
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <IoTrendingUp size={14} className="text-blue-500" />
                Popular Now
              </h3>
              {popular.length > 0 ? (
                <div className="space-y-2.5">
                  {popular.slice(0, 3).map((product, idx) => {
                    const price = product.salePrice || product.regularPrice;
                    return (
                      <Link key={product._id || idx} to={`/product/${product.slug || product._id}`} onClick={onClose}
                        className="flex items-center gap-2.5 group">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                          <img src={getImg(product.featuredImage || product.images?.[0])} alt={product.name}
                            className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</div>
                          <div className="text-[12px] font-bold text-gray-900">{formatPrice(price)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">Popular products will appear as customers browse</p>
              )}

              {/* Top Searches */}
              {topSearches.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <IoSearch size={10} /> Trending Searches
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {topSearches.slice(0, 6).map((s, i) => (
                      <Link key={i} to={`/shop?search=${encodeURIComponent(s.query)}`} onClick={onClose}
                        className="px-2.5 py-1 bg-gray-50 hover:bg-primary/5 hover:text-primary rounded-full text-[11px] font-medium text-gray-600 transition-colors border border-gray-100 hover:border-primary/20">
                        {s.query}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Link */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <Link to="/shop" onClick={onClose}
                  className="flex items-center gap-2 text-[12px] font-semibold text-primary hover:underline">
                  <IoStorefront size={14} /> Browse All Products <IoArrowForward size={10} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ── Search with Trending Suggestions ────────────────────────────────
const EnhancedSearchBar = ({ trendingProducts, formatPrice, className }) => {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();
  const { trackSearch, trackSearchClick } = useAnalytics();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ products: [], categories: [] });
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
      const categories = allCats.filter(c => c.name?.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 4);
      setResults({ products, categories });
    } catch (err) {
      console.error('Search error:', err);
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
      trackSearch(query.trim(), results.products?.length || 0);
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setFocused(false);
    }
  };

  const handleResultClick = () => { setQuery(''); setFocused(false); };

  const showTrending = focused && !query && trendingProducts?.length > 0;
  const showResults = focused && query.length >= 2 && (results.products.length > 0 || results.categories.length > 0);
  const showNoResults = focused && query.length >= 2 && !loading && results.products.length === 0 && results.categories.length === 0;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            placeholder="Search products, categories..."
            className="w-full pl-4 pr-20 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white"
            autoComplete="off"
          />
          <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults({ products: [], categories: [] }); inputRef.current?.focus(); }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <IoClose size={18} />
              </button>
            )}
            <button type="submit" className="h-[calc(100%-6px)] px-5 bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg flex items-center">
              <IoSearch size={20} />
            </button>
          </div>
        </div>
      </form>

      {/* Trending Suggestions (when empty + focused) */}
      {showTrending && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <IoTrendingUp size={14} className="text-primary" /> Trending Searches
            </span>
          </div>
          <div className="py-1">
            {trendingProducts.slice(0, 5).map(product => {
              const price = product.salePrice || product.regularPrice;
              return (
                <Link key={product._id} to={`/product/${product.slug || product._id}`} onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <img src={getImg(product.featuredImage || product.images?.[0])} alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                    <div className="text-xs font-bold text-primary">{formatPrice(price)}</div>
                  </div>
                  <IoArrowForward size={14} className="text-gray-300" />
                </Link>
              );
            })}
          </div>
          <Link to="/shop" onClick={handleResultClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 border-t border-gray-100 transition-colors">
            Browse All Products <IoArrowForward size={14} />
          </Link>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          )}
          {!loading && results.categories.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Categories</div>
              {results.categories.map(cat => (
                <Link key={cat._id} to={`/shop/${cat.slug}`} onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {cat.iconImage?.url ? (
                    <img src={getImg(cat.iconImage.url)} alt={cat.iconImage.alt || ''} className="w-8 h-8 rounded object-contain bg-gray-50" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{cat.name?.charAt(0)}</div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  <IoArrowForward size={14} className="text-gray-300 ml-auto" />
                </Link>
              ))}
            </div>
          )}
          {!loading && results.products.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Products</div>
              {results.products.map(product => {
                const price = product.salePrice || product.regularPrice;
                const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
                return (
                  <Link key={product._id} to={`/product/${product.slug || product._id}`} onClick={handleResultClick}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <img src={getImg(product.featuredImage || product.images?.[0])} alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-primary">{formatPrice(price)}</span>
                        {hasDiscount && <span className="text-xs text-gray-400 line-through">{formatPrice(product.regularPrice)}</span>}
                      </div>
                    </div>
                    <IoArrowForward size={14} className="text-gray-300" />
                  </Link>
                );
              })}
            </div>
          )}
          {!loading && (results.products.length > 0 || results.categories.length > 0) && (
            <button onClick={() => { handleSubmit({ preventDefault: () => {} }); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-gray-100">
              View all results for "{query}" <IoArrowForward size={14} />
            </button>
          )}
        </div>
      )}

      {showNoResults && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 text-center py-8">
          <div className="text-gray-400 text-3xl mb-2">🔍</div>
          <p className="text-sm text-gray-500">No results for "<strong>{query}</strong>"</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

// ── Main Default Header ─────────────────────────────────────────────
export default function DefaultHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [accountFlyoutOpen, setAccountFlyoutOpen] = useState(false);
  const megaRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { items: cartItems, clearCart } = useCartStore();
  const { items: wishlistItems, clearWishlist } = useWishlistStore();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { openAuthModal, openCartSidebar, cartBadgeBounce } = useUIStore();
  const { formatPrice } = useCurrencyStore();

  // Fetch default menu data (pages, categories, trending)
  const { data: menuDataRes } = useQuery('default-menu-data', menusAPI.getDefaultMenuData, {
    staleTime: 5 * 60 * 1000,
  });
  const menuData = menuDataRes?.data?.data || {};
  const activePages = menuData.pages || [];
  const categories = menuData.categories || [];
  const trendingProducts = menuData.trendingProducts || [];
  const ms = menuData.menuSettings || {};
  const topBar = ms.topBar || {};

  // Scroll handler for sticky mini-bar
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); setMegaMenuOpen(false); setAccountFlyoutOpen(false); }, [location.pathname]);

  // Close mega menu on click outside
  useEffect(() => {
    const handler = (e) => { if (megaRef.current && !megaRef.current.contains(e.target)) setMegaMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const isCollapsed = scrollY > 120;

  // Build nav items: Home, Shop (mega), active pages
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop', isMega: true },
    ...activePages
      .filter(p => !p.isHomepage)
      .map(p => ({ label: p.name, to: p.slug === 'home' ? '/' : `/${p.slug}` })),
  ];

  const handleLogout = () => {
    clearCart();
    clearWishlist();
    clearAuth();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      {/* Inject CSS for animations */}
      <style>{`
        @keyframes megaSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.35); }
          50% { transform: scale(0.9); }
          75% { transform: scale(1.15); }
        }
        .cart-badge-bounce {
          animation: cartBounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.2s ease-out; }
        .pesa-default-header-top {
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
          overflow: visible;
          position: relative;
          z-index: 100;
        }
        .pesa-default-header-top.collapsed {
          max-height: 0 !important;
          opacity: 0;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          overflow: hidden;
        }
      `}</style>

      {/* ═══ FULL HEADER (visible when not scrolled) ═══ */}
      <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${isCollapsed ? 'shadow-lg' : 'shadow-sm'}`}>
        {/* Top Bar */}
        {topBar.enabled !== false && (
        <div
          className={`pesa-default-header-top ${!topBar.backgroundColor ? 'bg-primary' : ''} ${!topBar.textColor ? 'text-white' : ''} ${isCollapsed ? 'collapsed' : ''}`}
          style={{ maxHeight: isCollapsed ? 0 : '50px', backgroundColor: topBar.backgroundColor || undefined, color: topBar.textColor || undefined, padding: topBar.padding || undefined, fontSize: topBar.fontSize || undefined }}>
          <div className="container-custom py-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3 sm:gap-6 min-w-0 overflow-hidden">
                {(topBar.phone) && (
                  <a href={`tel:${topBar.phone}`} className="flex items-center gap-1 sm:gap-1.5 shrink-0 hover:opacity-80">
                    <IoCall size={14} />
                    <span className="truncate">{topBar.phoneLabel || 'Call Us:'} <strong>{topBar.phone}</strong></span>
                  </a>
                )}
                {(topBar.location) && (
                  <div className="hidden md:flex items-center gap-1.5">
                    <IoLocation size={14} />
                    <span>{topBar.location}</span>
                  </div>
                )}
                {(topBar.announcement) && (
                  <div className="hidden lg:flex items-center">
                    <span>{topBar.announcement}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {topBar.showCurrency !== false && <CurrencyPicker variant="topbar" />}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Main Row: Logo + Search + Icons */}
        <div className={`border-b border-gray-100 transition-all duration-300 ${isCollapsed ? 'py-2' : 'py-3'}`}>
          <div className="container-custom">
            <div className="flex items-center justify-between gap-4 lg:gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center shrink-0">
                <img src={pesaLogo} alt="Pesa Shop" className={`transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-10'} w-auto object-contain`} />
              </Link>

              {/* Search Bar (desktop) */}
              <EnhancedSearchBar
                trendingProducts={trendingProducts}
                formatPrice={formatPrice}
                className="flex-1 max-w-2xl hidden md:block"
              />

              {/* Right Icons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Account */}
                <div className="relative hidden md:block">
                  <button onClick={() => {
                    if (!isAuthenticated) { openAuthModal('login'); return; }
                    setAccountFlyoutOpen(!accountFlyoutOpen);
                  }}
                    className="flex items-center gap-2 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <IoPerson size={20} />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left text-sm hidden lg:block">
                        <div className="text-gray-500 text-xs leading-tight">Account</div>
                        <div className="font-medium text-gray-900 leading-tight">{isAuthenticated ? user?.name?.split(' ')[0] : 'Login'}</div>
                      </div>
                    )}
                  </button>
                  {accountFlyoutOpen && isAuthenticated && (
                    <AccountFlyout user={user} onClose={() => setAccountFlyoutOpen(false)} onLogout={handleLogout} />
                  )}
                </div>

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Wishlist */}
                <Link to="/wishlist" className="relative p-1.5 rounded-lg hover:bg-gray-50 transition-colors hidden sm:flex">
                  <IoHeart size={24} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center bg-red-500 text-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button onClick={openCartSidebar} className="relative p-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <div className="relative">
                    <IoCart size={24} />
                    {cartItemCount > 0 && (
                      <span className={`absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1 text-[10px] font-bold rounded-full flex items-center justify-center bg-secondary text-black ${cartBadgeBounce ? 'cart-badge-bounce' : ''}`}>
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="hidden lg:block text-left text-sm">
                      <div className="text-gray-500 text-xs leading-tight">Cart</div>
                      <div className="font-medium text-gray-900 leading-tight">{cartItemCount} Items</div>
                    </div>
                  )}
                </button>

                {/* Mobile Menu Toggle */}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  {mobileMenuOpen ? <IoClose size={26} /> : <IoMenu size={26} />}
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="mt-3 md:hidden">
              <EnhancedSearchBar
                trendingProducts={trendingProducts}
                formatPrice={formatPrice}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Navigation Bar (desktop) */}
        <nav className="hidden md:block border-b border-gray-100 bg-white">
          <div className="container-custom">
            <div className="flex items-center">
              <div className="flex items-center flex-1">
                {navItems.map((item, i) => (
                  <div key={i} className="relative" ref={item.isMega ? megaRef : undefined}
                    onMouseEnter={() => item.isMega && setMegaMenuOpen(true)}
                    onMouseLeave={() => item.isMega && setMegaMenuOpen(false)}>
                    <Link to={item.to}
                      className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors hover:text-primary ${
                        location.pathname === item.to ? 'text-primary border-b-2 border-primary' : 'text-gray-700'
                      }`}>
                      {item.isMega && <IoGrid size={16} className="mr-0.5" />}
                      {item.label}
                      {item.isMega && <IoChevronDown size={12} className={`transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />}
                    </Link>
                    {item.isMega && megaMenuOpen && (
                      <CategoryMegaMenu
                        categories={categories}
                        onClose={() => setMegaMenuOpen(false)}
                        formatPrice={formatPrice}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Support in nav */}
              {topBar.phone && (
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                <IoCall className="text-primary" size={18} />
                <span>{topBar.phoneLabel || 'Need Support? Call Us:'} <strong className="text-gray-900">{topBar.phone}</strong></span>
              </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ═══ MOBILE SLIDE MENU ═══ */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={closeMobile} />
          <div className="fixed top-0 left-0 bottom-0 w-80 z-50 bg-white overflow-y-auto"
            style={{ animation: 'fadeInUp 0.2s ease-out' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src={pesaLogo} alt="Pesa Shop" className="h-7 w-auto object-contain" />
                <span className="text-lg font-bold text-gray-900">Menu</span>
              </div>
              <button onClick={closeMobile} className="p-1 hover:bg-gray-100 rounded-lg">
                <IoClose size={24} />
              </button>
            </div>

            {/* User Quick Access */}
            {isAuthenticated && (
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <Link to="/account" onClick={closeMobile} className="text-xs text-primary">View Account</Link>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Items */}
            <div className="py-2">
              {navItems.map((item, i) => (
                <MobileNavItem key={i} item={item} categories={categories} onClose={closeMobile} />
              ))}
            </div>

            {/* Extra Links */}
            <div className="border-t border-gray-100 py-2">
              <Link to="/wishlist" onClick={closeMobile} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                <IoHeart size={20} className="text-gray-400" />
                Wishlist
                {wishlistCount > 0 && <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{wishlistCount}</span>}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={closeMobile} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <IoPerson size={20} className="text-gray-400" />
                    My Account
                  </Link>
                  <Link to="/account/orders" onClick={closeMobile} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <IoReceipt size={20} className="text-gray-400" />
                    My Orders
                  </Link>
                  <button onClick={() => { handleLogout(); closeMobile(); }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full">
                    <IoLogOut size={20} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="p-4">
                  <button onClick={() => { closeMobile(); openAuthModal('login'); }}
                    className="w-full py-2.5 text-center text-white bg-primary font-medium rounded-lg hover:bg-primary/90 transition-colors">
                    Login / Register
                  </button>
                </div>
              )}
            </div>

            {/* Currency */}
            <div className="p-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Currency</div>
              <CurrencyPicker variant="header" />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Mobile Nav Item (supports expandable Shop mega) ─────────────────
function MobileNavItem({ item, categories, onClose }) {
  const [open, setOpen] = useState(false);

  if (item.isMega) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <Link to={item.to} onClick={onClose} className="flex-1 flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-900 hover:text-primary">
            <IoStorefront size={20} className="text-gray-400" />
            {item.label}
          </Link>
          <button onClick={() => setOpen(!open)} className="p-3 text-gray-400 hover:text-gray-600">
            {open ? <IoChevronDown size={16} /> : <IoChevronForward size={16} />}
          </button>
        </div>
        {open && (
          <div className="bg-gray-50 border-y border-gray-100 py-1">
            {categories.map(cat => (
              <Link key={cat._id} to={`/shop/${cat.slug}`} onClick={onClose}
                className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-700 hover:text-primary transition-colors">
                {cat.iconImage?.url ? (
                  <img src={getImg(cat.iconImage.url)} alt={cat.iconImage.alt || ''} className="w-6 h-6 rounded object-contain bg-gray-50" />
                ) : (
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                    {cat.name?.charAt(0)}
                  </div>
                )}
                {cat.name}
              </Link>
            ))}
            <Link to="/shop" onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary">
              View All <IoArrowForward size={14} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link to={item.to} onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-primary transition-colors">
      <IoHome size={20} className="text-gray-400" />
      {item.label}
    </Link>
  );
}
