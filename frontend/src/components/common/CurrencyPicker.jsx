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
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px] animate-fadeIn">
          {currencies.map((c) => (
            <button
              key={c._id || c.code}
              onClick={() => { setSelectedCurrency(c); setOpen(false); window.location.reload(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                selectedCurrency?.code === c.code ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-700'
              }`}
            >
              <span className="w-8 text-center text-base">{c.symbol}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-xs text-gray-400 font-mono">{c.code}</span>
              {selectedCurrency?.code === c.code && (
                <span className="text-primary text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
