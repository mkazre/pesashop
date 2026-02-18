import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

export default function LoyaltyPointsBadge({ productId, quantity = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    loyaltyAPI.calculateProductPoints(productId, quantity)
      .then(res => {
        if (res.data?.success && res.data.data?.points > 0) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId, quantity]);

  if (loading || !data || data.points <= 0) return null;

  const labels = data.labels || { points: 'PESA Coins', point: 'PESA Coin' };
  const pointLabel = data.points === 1 ? labels.point : labels.points;

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Earn <span className="text-amber-600">{data.points}</span> {pointLabel}
        </p>
        <p className="text-xs text-amber-600">
          Worth {formatPrice(data.cashValueZAR)} in rewards
        </p>
      </div>
    </div>
  );
}
