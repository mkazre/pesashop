import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { useAuthStore, useCartStore, useWishlistStore } from '@/store';
import { demographicsAPI } from '@/services/api';
import ProfileCompletionPopup from '@/components/account/ProfileCompletionPopup';

const NAV_ITEMS = [
  { path: '/account', label: 'Dashboard', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  ), end: true },
  { path: '/account/orders', label: 'Orders', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
  )},
  { path: '/account/laybyes', label: 'Laybyes', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  )},
  { path: '/account/payments', label: 'Payments', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
  )},
  { path: '/account/transactions', label: 'Transactions', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { path: '/account/loyalty-points', label: 'PESA Coins', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  )},
  { path: '/account/coupons', label: 'My Coupons', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  )},
  { path: '/account/gift-cards', label: 'Gift Cards', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8V21"/><path d="M3 12h18"/><path d="M12 8c-2-3-6-3-6 0s4 3 6 0"/><path d="M12 8c2-3 6-3 6 0s-4 3-6 0"/></svg>
  )},
  { path: '/account/wishlist', label: 'Wishlist', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  )},
  { path: '/account/addresses', label: 'Addresses', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
  )},
  { path: '/account/recurring-orders', label: 'Recurring Orders', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
  )},
  { path: '/account/my-offers', label: 'My Offers', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>
  )},
  { path: '/account/service-requests', label: 'My Service Requests', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
  )},
  { path: '/account/settings', label: 'Account Settings', badge: 'profile', icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
  )},
];

export default function AccountPage() {
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { clearCart } = useCartStore();
  const { clearWishlist } = useWishlistStore();
  const navigate = useNavigate();

  // Profile completion — drives notification badge on Account Settings link
  const { data: completionData } = useQuery(
    'profile-completion',
    () => demographicsAPI.getProfileCompletion(),
    { enabled: isAuthenticated, staleTime: 60000 }
  );
  const profileScore = completionData?.data?.data?.score;

  const handleLogout = () => {
    clearCart();
    clearWishlist();
    clearAuth();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileCompletionPopup />
      <div className="container-custom py-6">
        <Breadcrumbs items={[{ label: 'My Account' }]} />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-5 py-6 text-white">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold mb-3">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-300 text-sm mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.badge === 'profile' && profileScore !== undefined && profileScore < 100 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    )}
                  </NavLink>
                ))}
              </div>
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
