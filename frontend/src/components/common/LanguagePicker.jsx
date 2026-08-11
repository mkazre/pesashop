import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IoChevronDown, IoLanguage } from 'react-icons/io5';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export default function LanguagePicker({ variant = 'header', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { i18n } = useTranslation();

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) || SUPPORTED_LANGUAGES[0];

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        <IoLanguage size={14} className="opacity-70" />
        <span className="font-medium">{current.nativeLabel}</span>
        <IoChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 min-w-[170px] overflow-hidden"
          style={{ animation: 'fadeInUp 0.15s ease-out' }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = current.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-all ${
                  isActive
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="font-medium">{lang.nativeLabel}</span>
                <span className="text-gray-400">{lang.label}</span>
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
