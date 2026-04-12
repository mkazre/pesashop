import { useQuery, useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  pending_contact: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  active: 'Active',
  pending_contact: 'Awaiting Contact',
  contacted: 'Contacted',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export default function MyOffersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    'my-offers',
    () => offersAPI.getMine(),
    { staleTime: 30000 }
  );
  const offers = data?.data?.data || [];

  const cancelMutation = useMutation((id) => offersAPI.cancelMine(id), {
    onSuccess: () => queryClient.invalidateQueries('my-offers'),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">My Offers</h1>
        <p className="text-sm text-gray-500 mt-1">Offers and services you've subscribed to or requested</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-block w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-gray-600 font-medium">No offers yet</p>
          <p className="text-sm text-gray-400 mt-1">Browse offers available on product pages and at checkout</p>
          <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(item => {
            const expiryDate = item.expiryDate
              ? new Date(item.expiryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
              : null;
            const takenDate = item.purchaseDate || item.requestedAt
              ? new Date(item.purchaseDate || item.requestedAt).toLocaleDateString('en-ZA')
              : null;

            return (
              <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  {item.offer?.logoUrl ? (
                    <img src={item.offer.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">🏷️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.offer?.title || 'Offer'}</p>
                        {item.offer?.shortDescription && (
                          <p className="text-sm text-gray-500 mt-0.5">{item.offer.shortDescription}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {takenDate && <span>Taken: {takenDate}</span>}
                      {expiryDate && <span>Expires: {expiryDate}</span>}
                      {item.offer?.pricing?.amount > 0 && (
                        <span>R{item.offer.pricing.amount}/{item.offer.pricing.billingCycle || 'month'}</span>
                      )}
                    </div>

                    {item.status === 'pending_contact' && (
                      <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        We'll be in touch soon regarding this offer.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {['active', 'pending_contact'].includes(item.status) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (window.confirm('Cancel this offer?')) cancelMutation.mutate(item._id);
                      }}
                      className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
