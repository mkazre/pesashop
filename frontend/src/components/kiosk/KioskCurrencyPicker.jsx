import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { currenciesAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import { IoChevronDown, IoCheckmark } from 'react-icons/io5';

/**
 * Touch-friendly currency picker for the kiosk header.
 * Same data source as the website's CurrencyPicker (only active + showInFrontend),
 * but with bigger touch targets and no full-page reload (relies on Zustand
 * reactivity — formatPrice() everywhere updates automatically).
 */
export default function KioskCurrencyPicker() {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const { selectedCurrency, setCurrencies, setSelectedCurrency } = useCurrencyStore();

  const { data: currencyRes } = useQuery(
    'frontendCurrencies',
    () => currenciesAPI.getFrontend(),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const currencies = currencyRes?.data?.data || [];

  useEffect(() => {
    if (currencies.length > 0) setCurrencies(currencies);
  }, [currencies]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  if (currencies.length <= 1) return null;

  const code = selectedCurrency?.code || currencies[0]?.code || 'ZAR';
  const symbol = selectedCurrency?.symbol || currencies[0]?.symbol || 'R';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="kiosk-tile flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium"
      >
        <span className="text-lg leading-none">{symbol}</span>
        <span className="hidden md:inline font-mono">{code}</span>
        <IoChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[240px] overflow-hidden">
          <div className="px-4 py-2 text-xs uppercase tracking-widest text-gray-400 font-semibold">
            Choose currency
          </div>
          {currencies.map((c) => {
            const isActive = code === c.code;
            return (
              <button
                key={c._id || c.code}
                onClick={() => { setSelectedCurrency(c); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-base transition ${
                  isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl leading-none w-6 text-center">{c.symbol}</span>
                <span className="font-mono font-medium tracking-wide">{c.code}</span>
                <span className="text-sm text-gray-500 truncate">{c.name}</span>
                {isActive && <IoCheckmark size={20} className="ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
