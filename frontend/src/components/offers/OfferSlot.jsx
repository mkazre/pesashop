import { useQuery } from 'react-query';
import { offersAPI } from '@/services/api';
import OfferCard from './OfferCard';

/**
 * OfferSlot — fetches and renders contextual offers for a given page context.
 * Usage: <OfferSlot page="product_detail" compact />
 */
export default function OfferSlot({ page, compact = false, className = '' }) {
  const { data, isLoading } = useQuery(
    ['offers-slot', page],
    () => offersAPI.getForPage(page),
    { staleTime: 5 * 60 * 1000 }
  );

  const offers = data?.data?.data || [];

  if (isLoading || offers.length === 0) return null;

  return (
    <div className={className}>
      {compact ? (
        <div className="space-y-2">
          {offers.map(offer => (
            <OfferCard key={offer._id} offer={offer} compact />
          ))}
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Special Offers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offers.map(offer => (
              <OfferCard key={offer._id} offer={offer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
