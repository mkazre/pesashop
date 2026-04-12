import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import { Link } from 'react-router-dom';
import OfferCard from '@/components/offers/OfferCard';

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
  const [tab, setTab] = useState('mine'); // 'mine' | 'available'

  // My taken offers
  const { data: mineData, isLoading: mineLoading } = useQuery(
    'my-offers',
    () => offersAPI.getMine(),
    { staleTime: 30000 }
  );
  const myOffers = mineData?.data?.data || [];

  // Available offers (account page)
  const { data: availData, isLoading: availLoading } = useQuery(
    ['offers-slot', 'account'],
    () => offersAPI.getForPage('account'),
    { staleTime: 5 * 60 * 1000, enabled: tab === 'available' }
  );
  const availableOffers = availData?.data?.data || [];

  const cancelMutation = useMutation((id) => offersAPI.cancelMine(id), {
    onSuccess: () => { queryClient.invalidateQueries('my-offers'); },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h1 className="text-xl font-bold text-gray-900">My Offers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your active offers and discover new ones</p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: 'mine', label: `My Offers${myOffers.length ? ` (${myOffers.length})` : ''}` },
            { key: 'available', label: 'Available Offers' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* My taken offers */}
      {tab === 'mine' && (
        <>
          {mineLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="inline-block w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myOffers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="text-gray-600 font-medium">No offers taken yet</p>
              <p className="text-sm text-gray-400 mt-1">Browse available offers on product pages or the "Available Offers" tab</p>
              <button
                onClick={() => setTab('available')}
                className="mt-4 inline-block px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Available Offers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.map(item => {
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
                        <img src={item.offer.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">🏷️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-900">{item.offer?.title || item.offerTitle || 'Offer'}</p>
                            {item.offer?.shortDescription && (
                              <p className="text-sm text-gray-500 mt-0.5">{item.offer.shortDescription}</p>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                          {takenDate && <span>Taken: {takenDate}</span>}
                          {expiryDate && <span className="text-orange-500 font-medium">Expires: {expiryDate}</span>}
                          {item.offer?.providerName && <span>by {item.offer.providerName}</span>}
                        </div>

                        {item.status === 'pending_contact' && (
                          <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                            Our team will contact you soon regarding this offer. Check your email.
                          </p>
                        )}
                        {item.status === 'contacted' && (
                          <p className="mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                            A team member has reached out to you about this offer.
                          </p>
                        )}
                      </div>
                    </div>

                    {['active', 'pending_contact'].includes(item.status) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => { if (window.confirm('Cancel this offer?')) cancelMutation.mutate(item._id); }}
                          className="px-4 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Cancel Offer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Available offers tab */}
      {tab === 'available' && (
        <>
          {availLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="inline-block w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : availableOffers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-medium">No offers available right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back later or look for offers on product pages</p>
              <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Tap an offer to activate it</p>
              {availableOffers.map(offer => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  onTaken={() => {
                    queryClient.invalidateQueries('my-offers');
                    setTab('mine');
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
