import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/services/api';
import { useCartStore, useCurrencyStore } from '@/store';

export default function CartLoyaltyPoints() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { items } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (!items || items.length === 0) {
      setData(null);
      setLoading(false);
      return;
    }

    const cartItems = items.map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));

    setLoading(true);
    loyaltyAPI.calculateCartPoints(cartItems)
      .then(res => {
        if (res.data?.success && res.data.data?.points > 0) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [items]);

  if (loading || !data || data.points <= 0) return null;

  const labels = data.labels || { points: 'PESA Coins', point: 'PESA Coin' };
  const pointLabel = data.points === 1 ? labels.point : labels.points;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            You'll earn <span className="text-amber-600 text-base">{data.points}</span> {pointLabel} with this order
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Worth {formatPrice(data.cashValueZAR)} in rewards
          </p>
        </div>
      </div>
    </div>
  );
}
