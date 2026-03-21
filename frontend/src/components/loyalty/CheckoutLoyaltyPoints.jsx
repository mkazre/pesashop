import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/services/api';
import { useCartStore, useAuthStore, useCurrencyStore } from '@/store';
import toast from '@/utils/toast';

export default function CheckoutLoyaltyPoints({ orderTotal, onRedemptionChange }) {
  const [earnData, setEarnData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemValue, setRedeemValue] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemApplied, setRedeemApplied] = useState(false);
  const [settings, setSettings] = useState(null);
  const { items } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrencyStore();

  // Fetch earn data for cart
  useEffect(() => {
    if (!items || items.length === 0) return;
    const cartItems = items.map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));
    loyaltyAPI.calculateCartPoints(cartItems)
      .then(res => {
        if (res.data?.success && res.data.data?.points > 0) {
          setEarnData(res.data.data);
        }
      })
      .catch(() => {});
  }, [items]);

  // Fetch balance + settings if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loyaltyAPI.getBalance()
      .then(res => {
        if (res.data?.success) setBalance(res.data.data.balance || 0);
      })
      .catch(() => {});
    loyaltyAPI.getPublicSettings()
      .then(res => {
        if (res.data?.success) setSettings(res.data.data);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleCalculateRedemption = async () => {
    const pts = parseInt(redeemPoints);
    if (!pts || pts <= 0) {
      toast.error('Enter a valid points amount');
      return;
    }
    if (pts > balance) {
      toast.error(`You only have ${balance} points`);
      return;
    }
    setRedeeming(true);
    try {
      const res = await loyaltyAPI.calculateRedemption(pts, orderTotal);
      if (res.data?.success) {
        const val = res.data.data.value || 0;
        setRedeemValue(val);
        setRedeemApplied(true);
        if (onRedemptionChange) onRedemptionChange(res.data.data.points, val);
        toast.success(`${res.data.data.points} points = ${formatPrice(val)} discount applied`);
      } else {
        toast.error(res.data?.data?.error || 'Cannot redeem points');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate redemption');
    } finally {
      setRedeeming(false);
    }
  };

  const handleRemoveRedemption = () => {
    setRedeemApplied(false);
    setRedeemValue(0);
    setRedeemPoints('');
    if (onRedemptionChange) onRedemptionChange(0, 0);
  };

  const labels = earnData?.labels || settings?.labels || { points: 'PESA Coins', point: 'PESA Coin' };

  return (
    <div className="bg-white border-2 border-gray-200 p-6 space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {labels.points}
      </h3>

      {/* Points to earn */}
      {earnData && earnData.points > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            You'll earn <span className="font-bold text-amber-600">{earnData.points}</span> {earnData.points === 1 ? labels.point : labels.points} with this order
            <span className="text-xs text-amber-600 ml-1">(worth {formatPrice(earnData.cashValueZAR)})</span>
          </p>
        </div>
      )}

      {/* Redeem points */}
      {isAuthenticated && balance > 0 && settings?.enabled && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-700 mb-2">
            Your balance: <span className="font-bold">{balance}</span> {labels.points}
            <span className="text-gray-500 ml-1">(worth {formatPrice(balance * (settings.redemptionRate || 0))})</span>
          </p>

          {redeemApplied ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {redeemPoints} {labels.points} redeemed
                </p>
                <p className="text-xs text-green-600">
                  Discount: {formatPrice(redeemValue)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveRedemption}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={balance}
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder={`Enter ${labels.points.toLowerCase()} to redeem`}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCalculateRedemption}
                disabled={redeeming}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {redeeming ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}

          {settings.minRedemptionPoints > 0 && !redeemApplied && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum {settings.minRedemptionPoints} {labels.points.toLowerCase()} required
            </p>
          )}
        </div>
      )}
    </div>
  );
}
