import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  IoHomeOutline, IoHome,
  IoGridOutline, IoGrid,
  IoSearchOutline, IoSearch,
  IoCartOutline, IoCart,
  IoPersonOutline, IoPerson,
  IoClose, IoChevronForward, IoArrowForward,
} from 'react-icons/io5';
import { useCartStore, useAuthStore, useUIStore } from '@/store';
import { useQuery } from 'react-query';
import { menusAPI } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '/placeholder.jpg';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const { items: cartItems } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal, openCartSidebar, cartBadgeBounce } = useUIStore();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch categories
  const { data: menuDataRes } = useQuery('default-menu-data', menusAPI.getDefaultMenuData, {
    staleTime: 5 * 60 * 1000,
  });
  const categories = menuDataRes?.data?.data?.categories || [];

  // Close overlays on route change
  useEffect(() => {
    setCategoriesOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const isActive = (path) => location.pathname === path;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInputRef.current?.value?.trim();
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    }
  };

  const navItems = [
    {
      label: 'Home',
      icon: IoHomeOutline,
      activeIcon: IoHome,
      action: () => navigate('/'),
      active: isActive('/'),
    },
    {
      label: 'Categories',
      icon: IoGridOutline,
      activeIcon: IoGrid,
      action: () => setCategoriesOpen(!categoriesOpen),
      active: categoriesOpen,
    },
    {
      label: 'Search',
      icon: IoSearchOutline,
      activeIcon: IoSearch,
      action: () => setSearchOpen(!searchOpen),
      active: searchOpen,
    },
    {
      label: 'Cart',
      icon: IoCartOutline,
      activeIcon: IoCart,
      action: openCartSidebar,
      active: false,
      badge: cartCount,
    },
    {
      label: 'Account',
      icon: IoPersonOutline,
      activeIcon: IoPerson,
      action: () => isAuthenticated ? navigate('/account') : openAuthModal('login'),
      active: location.pathname.startsWith('/account'),
    },
  ];

  return (
    <>
      {/* Inject styles */}
      <style>{`
        @media (min-width: 768px) {
          .pesa-mobile-bottom-nav { display: none !important; }
          .pesa-mobile-bottom-spacer { display: none !important; }
        }
        .pesa-mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 45;
          background: white;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        @keyframes slideUpOverlay {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .mobile-overlay-slide-up {
          animation: slideUpOverlay 0.25s ease-out;
        }
      `}</style>

      {/* Bottom spacer to prevent content from being hidden behind nav */}
      <div className="pesa-mobile-bottom-spacer h-16" />

      {/* Categories Sheet */}
      {categoriesOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCategoriesOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto mobile-overlay-slide-up"
            style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">Categories</h3>
              <button onClick={() => setCategoriesOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <IoClose size={22} />
              </button>
            </div>
            <div className="py-2">
              {categories.map(cat => (
                <Link key={cat._id} to={`/shop/${cat.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {cat.iconImage?.url ? (
                    <img src={getImg(cat.iconImage.url)} alt={cat.iconImage.alt || ''} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {cat.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                    {cat.productCount > 0 && <div className="text-xs text-gray-400">{cat.productCount} items</div>}
                  </div>
                  <IoChevronForward size={16} className="text-gray-300" />
                </Link>
              ))}
              <Link to="/shop" className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 border-t border-gray-100 mt-1">
                View All Categories <IoArrowForward size={14} />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Search Sheet */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSearchOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl mobile-overlay-slide-up"
            style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Search</h3>
              <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <IoClose size={22} />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-4 pr-14 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                    autoComplete="off"
                  />
                  <button type="submit" className="absolute right-1 top-1 bottom-1 px-4 bg-primary text-white rounded-lg flex items-center">
                    <IoSearch size={20} />
                  </button>
                </div>
              </form>
              {/* Quick Category Links */}
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Links</div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 6).map(cat => (
                    <Link key={cat._id} to={`/shop/${cat.slug}`}
                      className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <div className="pesa-mobile-bottom-nav">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.active ? item.activeIcon : item.icon;
            return (
              <button key={item.label} onClick={item.action}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative ${
                  item.active ? 'text-primary' : 'text-gray-500'
                }`}>
                <div className="relative">
                  <Icon size={22} />
                  {item.badge > 0 && (
                    <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center bg-secondary text-black ${
                      item.label === 'Cart' && cartBadgeBounce ? 'cart-badge-bounce' : ''
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
