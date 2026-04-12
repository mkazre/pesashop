import { useQuery } from 'react-query';
import { serviceProviderAdsAPI } from '@/services/api';
import ServiceProviderAdCard from './ServiceProviderAdCard';

/**
 * ServiceProviderAdSlot — fetches and renders contextual service provider ads.
 *
 * Props:
 *   slotId      — e.g. "product_detail_below_buy", "home_banner"
 *   pageType    — e.g. "product", "home", "category"
 *   categorySlug— product/category slug for contextual matching
 *   productId   — product ID for contextual matching
 *   maxAds      — max ads to display (default 2)
 *   className   — wrapper class
 */
export default function ServiceProviderAdSlot({
  slotId,
  pageType,
  categorySlug,
  productId,
  maxAds = 2,
  className = '',
}) {
  const { data } = useQuery(
    ['sp-ads', slotId, pageType, productId],
    () => serviceProviderAdsAPI.getContextual({ slotId, pageType, categorySlug, productId }),
    {
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  );

  const ads = (data?.data?.data || []).slice(0, maxAds);

  if (!ads.length) return null;

  return (
    <div className={className}>
      <div className={`grid gap-3 ${maxAds > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {ads.map(ad => (
          <ServiceProviderAdCard key={ad._id} ad={ad} />
        ))}
      </div>
    </div>
  );
}
