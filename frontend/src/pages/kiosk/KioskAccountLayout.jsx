import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '@/store';
import KioskHeader from '@/components/kiosk/KioskHeader';
import {
  IoGridOutline, IoReceiptOutline, IoWalletOutline, IoCardOutline, IoSwapHorizontalOutline,
  IoStarOutline, IoTicketOutline, IoGiftOutline, IoHeartOutline, IoLocationOutline,
  IoRefreshOutline, IoMegaphoneOutline, IoChatbubblesOutline, IoSettingsOutline,
  IoBusinessOutline, IoLogOutOutline,
} from 'react-icons/io5';

const NAV_ITEMS = [
  { to: '/kiosk/account', label: 'Dashboard', icon: IoGridOutline, end: true },
  { to: '/kiosk/account/orders', label: 'Orders', icon: IoReceiptOutline },
  { to: '/kiosk/account/laybyes', label: 'Laybyes', icon: IoWalletOutline },
  { to: '/kiosk/account/payments', label: 'Payments', icon: IoCardOutline },
  { to: '/kiosk/account/transactions', label: 'Transactions', icon: IoSwapHorizontalOutline },
  { to: '/kiosk/account/loyalty-points', label: 'PESA Coins', icon: IoStarOutline },
  { to: '/kiosk/account/coupons', label: 'My Coupons', icon: IoTicketOutline },
  { to: '/kiosk/account/gift-cards', label: 'Gift Cards', icon: IoGiftOutline },
  { to: '/kiosk/account/wishlist', label: 'Wishlist', icon: IoHeartOutline },
  { to: '/kiosk/account/addresses', label: 'Addresses', icon: IoLocationOutline },
  { to: '/kiosk/account/recurring-orders', label: 'Recurring Orders', icon: IoRefreshOutline },
  { to: '/kiosk/account/my-offers', label: 'My Offers', icon: IoMegaphoneOutline },
  { to: '/kiosk/account/service-requests', label: 'Service Requests', icon: IoChatbubblesOutline },
  { to: '/kiosk/account/settings', label: 'Account Settings', icon: IoSettingsOutline },
  { to: '/kiosk/account/provider-portal', label: 'Service Provider Portal', icon: IoBusinessOutline },
];

export default function KioskAccountLayout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const clearCart = useCartStore(s => s.clearCart);

  if (!user) {
    // Soft redirect — render a hint and link to auth
    return (
      <div className="min-h-screen flex flex-col">
        <KioskHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-700">Please sign in</div>
            <button onClick={() => navigate('/kiosk/auth?redirect=/kiosk/account', { replace: true })} className="mt-4 px-6 py-3 bg-primary text-white rounded-xl text-lg font-semibold">
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (typeof clearCart === 'function') clearCart();
    clearAuth();
    try { localStorage.removeItem('token'); } catch {}
    navigate('/kiosk', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-6 py-6 md:px-10 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Side nav */}
          <aside className="bg-white rounded-2xl shadow-sm p-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] overflow-y-auto kiosk-scroll">
            <div className="px-4 py-3 mb-2">
              <div className="text-xs uppercase tracking-widest text-gray-400">Account</div>
              <div className="text-lg font-semibold text-gray-800 truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50"
              >
                <IoLogOutOutline size={20} /> Sign out
              </button>
            </nav>
          </aside>

          {/* Content — existing account sub-page renders here */}
          <section className="kiosk-account-scope min-w-0">
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
              <Outlet />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
