import { useEffect, useRef } from 'react';
import { serviceProviderAdsAPI } from '@/services/api';

/**
 * ServiceProviderAdCard — renders a single service provider advertisement.
 * Tracks impression on mount; records click on CTA.
 */
export default function ServiceProviderAdCard({ ad }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && ad?._id) {
      tracked.current = true;
      serviceProviderAdsAPI.recordImpression(ad._id).catch(() => {});
    }
  }, [ad?._id]);

  if (!ad) return null;

  const handleClick = () => {
    serviceProviderAdsAPI.recordClick(ad._id).catch(() => {});
    if (ad.ctaUrl) window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-28 object-cover" />
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {ad.provider?.logoUrl && (
            <img src={ad.provider.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-100 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{ad.title}</p>
            {ad.provider?.businessName && (
              <p className="text-xs text-gray-400 truncate">{ad.provider.businessName}</p>
            )}
          </div>
          <span className="ml-auto text-[10px] text-gray-300 flex-shrink-0">Ad</span>
        </div>
        {ad.body && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ad.body}</p>}
        {ad.ctaText && (
          <button
            onClick={handleClick}
            className="w-full py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            {ad.ctaText}
          </button>
        )}
      </div>
    </div>
  );
}
