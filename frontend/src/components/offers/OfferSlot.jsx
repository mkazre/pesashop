import { useState } from 'react';
import { useQuery } from 'react-query';
import { offersAPI } from '@/services/api';
import OfferCard from './OfferCard';

/**
 * OfferSlot — collapsible toggle panel, styled like LaybyWidget.
 * Usage: <OfferSlot page="product_detail" />
 */
export default function OfferSlot({ page, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery(
    ['offers-slot', page],
    () => offersAPI.getForPage(page),
    { staleTime: 5 * 60 * 1000 }
  );

  const offers = data?.data?.data || [];

  // Don't render anything while loading or if no offers
  if (isLoading || offers.length === 0) return null;

  return (
    <div className={`border-t border-gray-200 pt-4 ${className}`}>
      {/* Toggle button — same style as Layby/Recurring */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed border-primary/40 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏷️</span>
          <span>Special Offers Available ({offers.length})</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-3 border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-2">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Tap an offer to activate it — we may contact you with more details.
          </p>
          {offers.map(offer => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
