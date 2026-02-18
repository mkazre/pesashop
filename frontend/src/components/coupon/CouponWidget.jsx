import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { couponsAPI } from '@/services/api';
import { useCartStore, useAuthStore, useCurrencyStore } from '@/store';
import toast from 'react-hot-toast';

export default function CouponWidget({ onCouponApplied, onCouponRemoved, compact = false }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const { items, getTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [searchParams] = useSearchParams();

  const cartTotal = getTotal();

  // Auto-apply coupon from URL (?coupon=CODE)
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon && !appliedCoupon) {
      handleApply(urlCoupon);
    }
  }, [searchParams]);

  const handleApply = async (couponCode) => {
    const codeToUse = (couponCode || code).trim().toUpperCase();
    if (!codeToUse) {
      toast.error('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const cartItems = items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.salePrice || item.product.regularPrice
      }));

      // Use public validate for guests, authenticated validate for logged-in users
      const validateFn = isAuthenticated ? couponsAPI.validate : couponsAPI.publicValidate;
      const res = await validateFn(codeToUse, cartTotal, cartItems);

      if (res.data?.success) {
        const { coupon, discount: disc } = res.data.data;
        setAppliedCoupon(coupon);
        setDiscount(disc);
        setCode('');
        if (onCouponApplied) onCouponApplied(coupon, disc);
        toast.success(`Coupon "${coupon.code}" applied! ${coupon.type === 'free_shipping' ? 'Free shipping!' : `You save ${formatPrice(disc)}`}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    if (onCouponRemoved) onCouponRemoved();
    toast.success('Coupon removed');
  };

  const getTypeLabel = (coupon) => {
    if (!coupon) return '';
    switch (coupon.type) {
      case 'percentage': return `${coupon.value}% off`;
      case 'fixed': return `${formatPrice(coupon.value)} off`;
      case 'fixed_product': return `${formatPrice(coupon.value)} off per item`;
      case 'bogo': return 'Buy One Get One';
      case 'free_shipping': return 'Free Shipping';
      default: return '';
    }
  };

  if (compact) {
    return (
      <div className="mt-3">
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <span className="text-sm font-medium text-green-800">{appliedCoupon.code}</span>
              <span className="text-xs text-green-600">({getTypeLabel(appliedCoupon)})</span>
            </div>
            <button onClick={handleRemove} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-primary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            />
            <button
              type="button"
              onClick={() => handleApply()}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? '...' : 'Apply'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 p-5 mt-4">
      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        Coupon Code
      </h3>

      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
              <p className="text-sm text-green-600 mt-0.5">{getTypeLabel(appliedCoupon)}</p>
              {appliedCoupon.description && (
                <p className="text-xs text-green-500 mt-1">{appliedCoupon.description}</p>
              )}
            </div>
            <div className="text-right">
              {discount > 0 && (
                <p className="text-lg font-bold text-green-700">-{formatPrice(discount)}</p>
              )}
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            />
            <button
              type="button"
              onClick={() => handleApply()}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {appliedCoupon?.minimumAmount > 0 && (
            <p className="text-xs text-gray-500 mt-2">Minimum order: {formatPrice(appliedCoupon.minimumAmount)}</p>
          )}
        </div>
      )}
    </div>
  );
}
