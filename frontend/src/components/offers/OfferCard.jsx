import { useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import { useAuthStore, useUIStore } from '@/store';
import toast from '@/utils/toast';

/**
 * OfferCard — uniform display for a single offer.
 * Supports types: purchasable, subscription, contact_request.
 */
export default function OfferCard({ offer, compact = false }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();

  const takeMutation = useMutation(
    () => offersAPI.take(offer._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-offers');
        toast.success(`You've taken the "${offer.title}" offer!`);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Action failed')
    }
  );

  const contactMutation = useMutation(
    () => offersAPI.contactRequest(offer._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-offers');
        toast.success("We'll be in touch about this offer.");
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Request failed')
    }
  );

  const handleAction = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (offer.offerType === 'contact_request') {
      contactMutation.mutate();
    } else {
      takeMutation.mutate();
    }
  };

  const ctaText = offer.ctaButtonText
    || (offer.offerType === 'contact_request' ? 'Request More Info'
      : offer.offerType === 'subscription' ? 'Subscribe'
      : 'Get This Offer');

  const isPending = takeMutation.isLoading || contactMutation.isLoading;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
        {offer.logoUrl ? (
          <img src={offer.logoUrl} alt={offer.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-lg">🏷️</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{offer.title}</p>
          {offer.pricing?.amount > 0 && (
            <p className="text-xs text-gray-500">R{offer.pricing.amount}/{offer.pricing.billingCycle || 'month'}</p>
          )}
        </div>
        <button
          onClick={handleAction}
          disabled={isPending}
          className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : ctaText}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {offer.bannerImageUrl && (
        <img src={offer.bannerImageUrl} alt="" className="w-full h-24 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {offer.logoUrl ? (
            <img src={offer.logoUrl} alt={offer.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-2xl">🏷️</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{offer.title}</p>
            {offer.providerName && <p className="text-xs text-gray-400 mt-0.5">by {offer.providerName}</p>}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{offer.shortDescription || offer.description?.slice(0, 100)}</p>
        {offer.pricing?.amount > 0 && (
          <p className="text-sm font-semibold text-gray-900 mb-3">
            R{offer.pricing.amount}
            <span className="text-xs font-normal text-gray-500">/{offer.pricing.billingCycle || 'month'}</span>
          </p>
        )}
        <button
          onClick={handleAction}
          disabled={isPending}
          className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Processing...' : ctaText}
        </button>
      </div>
    </div>
  );
}
