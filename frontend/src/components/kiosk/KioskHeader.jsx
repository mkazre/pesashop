import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore, useAuthStore } from '@/store';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import KioskCurrencyPicker from '@/components/kiosk/KioskCurrencyPicker';
import {
  IoHomeOutline, IoSearchOutline, IoCartOutline, IoPersonOutline, IoArrowBackOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

export default function KioskHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useCartStore(s => s.items);
  const { user } = useAuthStore();
  const { config } = useKioskConfig();

  const cartCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const onHome = location.pathname === '/kiosk' || location.pathname === '/kiosk/';
  const logoUrl = config?.branding?.logoUrl;

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-4 flex items-center gap-4">
        {!onHome && (
          <button
            onClick={() => navigate(-1)}
            className="kiosk-tile flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium"
          >
            <IoArrowBackOutline size={22} /> Back
          </button>
        )}
        <button onClick={() => navigate('/kiosk')} className="kiosk-tile flex items-center gap-3">
          {logoUrl ? (
            <img src={resolveUrl(logoUrl)} alt="Logo" className="h-12 w-auto" />
          ) : (
            <span className="text-2xl font-bold text-primary">PESA Shop</span>
          )}
        </button>

        <div className="flex-1" />

        <button onClick={() => navigate('/kiosk/search')} className="kiosk-tile flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl text-gray-700">
          <IoSearchOutline size={24} />
          <span className="hidden md:inline font-medium">Search</span>
        </button>

        <KioskCurrencyPicker />

        <button onClick={() => navigate('/kiosk/cart')} className="kiosk-tile relative flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl text-gray-700">
          <IoCartOutline size={24} />
          <span className="hidden md:inline font-medium">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-secondary text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button onClick={() => navigate(user ? '/kiosk/account' : '/kiosk/auth')} className="kiosk-tile flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl">
          <IoPersonOutline size={24} />
          <span className="hidden md:inline font-medium">{user ? user.firstName || 'Account' : 'Sign In'}</span>
        </button>

        {!onHome && (
          <button
            onClick={() => navigate('/kiosk')}
            className="kiosk-tile flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100"
          >
            <IoHomeOutline size={22} />
          </button>
        )}
      </div>
    </header>
  );
}
