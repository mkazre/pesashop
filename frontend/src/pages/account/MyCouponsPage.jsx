import { useState, useEffect } from 'react';
import { couponsAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import toast from '@/utils/toast';

export default function MyCouponsPage() {
  const [available, setAvailable] = useState([]);
  const [used, setUsed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const { formatPrice } = useCurrencyStore();
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await couponsAPI.getMyCoupons();
      if (res.data?.success) {
        setAvailable(res.data.data.available || []);
        setUsed(res.data.data.used || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Copied: ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getTypeLabel = (coupon) => {
    switch (coupon.type) {
      case 'percentage': return `${coupon.value}% off`;
      case 'fixed': return `${formatPrice(coupon.value)} off`;
      case 'fixed_product': return `${formatPrice(coupon.value)} off per item`;
      case 'bogo': return 'Buy One Get One';
      case 'free_shipping': return 'Free Shipping';
      default: return coupon.type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-700';
      case 'fixed': return 'bg-green-100 text-green-700';
      case 'fixed_product': return 'bg-purple-100 text-purple-700';
      case 'bogo': return 'bg-orange-100 text-orange-700';
      case 'free_shipping': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const CouponCard = ({ coupon, isUsed = false }) => (
    <div className={`border-2 rounded-xl overflow-hidden transition-shadow hover:shadow-md ${isUsed ? 'border-gray-200 opacity-70' : 'border-gray-200'}`}>
      <div className={`px-5 py-3 flex items-center justify-between ${isUsed ? 'bg-gray-50' : 'bg-gradient-to-r from-primary/5 to-primary/10'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg tracking-wider">{coupon.code}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(coupon.type)}`}>
              {getTypeLabel(coupon)}
            </span>
          </div>
        </div>
        {!isUsed && (
          <button
            onClick={() => copyCode(coupon.code)}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {copiedCode === coupon.code ? 'Copied!' : 'Copy'}
          </button>
        )}
        {isUsed && (
          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-medium">Used</span>
        )}
      </div>
      <div className="px-5 py-3 space-y-1.5">
        {coupon.description && (
          <p className="text-sm text-gray-600">{coupon.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {coupon.minimumAmount > 0 && (
            <span>Min order: {formatPrice(coupon.minimumAmount)}</span>
          )}
          {coupon.maxDiscount > 0 && (
            <span>Max discount: {formatPrice(coupon.maxDiscount)}</span>
          )}
          {coupon.endDate && (
            <span>Expires: {new Date(coupon.endDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          )}
          {coupon.usageLimitPerUser && (
            <span>Uses: {coupon.userUsageCount || 0}/{coupon.usageLimitPerUser}</span>
          )}
          {coupon.excludeSaleItems && (
            <span className="text-orange-500">Excludes sale items</span>
          )}
          {coupon.freeShipping && (
            <span className="text-teal-600">Free shipping included</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Coupons</h1>
        <p className="text-gray-500 mt-1">View and use your available coupon codes</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('available')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'available' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available ({available.length})
          </button>
          <button
            onClick={() => setTab('used')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'used' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Used ({used.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {tab === 'available' && (
        <div className="space-y-4">
          {available.length > 0 ? (
            available.map(coupon => <CouponCard key={coupon._id} coupon={coupon} />)
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              <p className="text-gray-500">No coupons available right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new offers!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'used' && (
        <div className="space-y-4">
          {used.length > 0 ? (
            used.map(coupon => <CouponCard key={coupon._id} coupon={coupon} isUsed />)
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No used coupons yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
