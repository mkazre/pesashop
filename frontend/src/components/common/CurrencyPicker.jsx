import { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { currenciesAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

export default function CurrencyPicker({ variant = 'header', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { selectedCurrency, setCurrencies, setSelectedCurrency } = useCurrencyStore();

  // Fetch currencies from backend (only active + showInFrontend)
  const { data: currencyRes } = useQuery(
    'frontendCurrencies',
    () => currenciesAPI.getFrontend(),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const currencies = currencyRes?.data?.data || [];

  // Sync backend currencies into store on load
  useEffect(() => {
    if (currencies.length > 0) {
      setCurrencies(currencies);
    }
  }, [currencies]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (currencies.length <= 1) return null; // No picker needed if only one currency

  const isTopBar = variant === 'topbar';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 transition-colors ${
          isTopBar
            ? 'text-inherit text-sm hover:opacity-80'
            : 'text-sm text-gray-700 hover:text-primary px-2 py-1 rounded border border-gray-200 hover:border-primary'
        }`}
      >
        <span className="font-medium">{selectedCurrency?.code || 'USD'}</span>
        <span className="opacity-70">{selectedCurrency?.symbol || '$'}</span>
        <IoChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 min-w-[130px] overflow-hidden"
          style={{ animation: 'fadeInUp 0.15s ease-out' }}>
          {currencies.map((c) => {
            const isActive = selectedCurrency?.code === c.code;
            return (
              <button
                key={c._id || c.code}
                onClick={() => { setSelectedCurrency(c); setOpen(false); window.location.reload(); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-all ${
                  isActive
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`text-base leading-none ${isActive ? 'text-primary' : 'text-gray-400'}`}>{c.symbol}</span>
                <span className="font-mono font-medium tracking-wide">{c.code}</span>
                {isActive && (
                  <span className="ml-auto text-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
