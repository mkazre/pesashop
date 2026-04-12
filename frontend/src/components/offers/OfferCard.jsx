import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import { useAuthStore, useUIStore } from '@/store';
import toast from '@/utils/toast';

/**
 * OfferCard — compact layby-style card for offers panel.
 * contact_request: shows "We'll be in touch" after click.
 * purchasable/subscription: confirms and records as taken.
 */
export default function OfferCard({ offer, onTaken }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [done, setDone] = useState(false);

  const takeMutation = useMutation(
    () => offersAPI.take(offer._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-offers');
        setDone(true);
        onTaken?.();
        toast.success(offer.offerType === 'contact_request'
          ? "Thanks! We'll be in touch soon."
          : `"${offer.title}" activated!`);
      },
      onError: (e) => {
        const msg = e.response?.data?.message || 'Action failed';
        if (msg.includes('already')) {
          setDone(true);
          toast.success('You already have this offer');
        } else {
          toast.error(msg);
        }
      }
    }
  );

  const handleAction = () => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    if (done) return;
    takeMutation.mutate();
  };

  const ctaText = offer.ctaButtonText
    || (offer.offerType === 'contact_request' ? 'Request Info'
      : offer.offerType === 'subscription' ? 'Subscribe'
      : 'Get Offer');

  if (done) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
        <span className="text-xl flex-shrink-0">✅</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-800 text-sm truncate">{offer.title}</p>
          <p className="text-xs text-green-600 mt-0.5">
            {offer.offerType === 'contact_request' ? "We'll be in touch soon!" : 'Offer activated!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all">
      {/* Logo / icon */}
      {offer.logoUrl ? (
        <img src={offer.logoUrl} alt={offer.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-base">🏷️</div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm truncate">{offer.title}</p>
          {offer.badgeText && (
            <span className="badge badge-xs" style={{ backgroundColor: offer.badgeColor || '#3B82F6', color: '#fff', border: 'none' }}>
              {offer.badgeText}
            </span>
          )}
        </div>
        {offer.shortDescription && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{offer.shortDescription}</p>
        )}
        {offer.providerName && (
          <p className="text-xs text-gray-400 mt-0.5">by {offer.providerName}</p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleAction}
        disabled={takeMutation.isLoading}
        className="flex-shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors whitespace-nowrap"
      >
        {takeMutation.isLoading ? '...' : ctaText}
      </button>
    </div>
  );
}
