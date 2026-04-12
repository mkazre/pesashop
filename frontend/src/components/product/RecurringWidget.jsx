import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurringOrdersAPI } from '@/services/api';
import { useAuthStore, useUIStore, useCurrencyStore } from '@/store';
import toast from '@/utils/toast';

const FREQ_LABELS = {
  daily: 'Daily', weekly: 'Weekly', fortnightly: 'Every 2 weeks',
  monthly: 'Monthly', bimonthly: 'Every 2 months', quarterly: 'Quarterly',
};

/**
 * RecurringWidget — mirrors the LaybyWidget toggle style.
 * Shown below the Layby widget on ProductDetailPage.
 * Lets logged-in customers set up a recurring purchase (upfront or PAYG).
 */
export default function RecurringWidget({ product }) {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState('pay_as_you_go');
  const [instances, setInstances] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  const { data: plansData } = useQuery(
    ['recurring-plans-public', product?._id],
    () => recurringOrdersAPI.getPlansForProduct(product._id),
    { enabled: !!product?._id, staleTime: 5 * 60 * 1000 }
  );
  const plans = plansData?.data?.data || [];

  const selectedPlan = plans.find(p => p._id === selectedPlanId) || plans[0];

  const createMutation = useMutation(
    (data) => recurringOrdersAPI.create(data),
    {
      onSuccess: () => {
        setSubmitted(true);
        queryClient.invalidateQueries('my-recurring-orders');
        toast.success('Recurring order set up!');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to set up recurring order');
      }
    }
  );

  const handleToggle = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsOpen(prev => !prev);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!selectedPlan) return;
    createMutation.mutate({
      productId: product._id,
      recurringPlanId: selectedPlan._id,
      frequency: selectedPlan.frequency,
      quantity,
      paymentMode,
      totalInstances: paymentMode === 'upfront' ? instances : undefined,
    });
  };

  if (!product) return null;

  const price = product.salePrice || product.regularPrice || product.price || 0;
  const totalUpfront = price * quantity * instances;

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Toggle button — same style as Layby */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <span>Set up Recurring Purchase</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {isOpen && !submitted && (
        <div className="mt-3 border border-emerald-200 rounded-xl p-5 bg-emerald-50 space-y-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Recurring Purchase Setup</p>
            <p className="text-xs text-gray-500 mt-0.5">Get this product delivered automatically at your chosen interval</p>
          </div>

          {plans.length === 0 ? (
            <p className="text-sm text-gray-400">Recurring purchases are not available for this product.</p>
          ) : (
            <>
              {/* Frequency selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Delivery Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {plans.map(plan => (
                    <button
                      key={plan._id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(plan._id);
                        // Reset payment mode to first allowed
                        if (!plan.allowedPaymentModes?.includes(paymentMode)) {
                          setPaymentMode(plan.allowedPaymentModes?.[0] || 'pay_as_you_go');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-colors ${
                        (selectedPlan?._id === plan._id)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {FREQ_LABELS[plan.frequency] || plan.frequency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantity per Delivery</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(selectedPlan?.minQuantity || 1, q - 1))}
                    className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                  >−</button>
                  <span className="w-8 text-center font-medium text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(selectedPlan?.maxQuantity || 100, q + 1))}
                    className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                  >+</button>
                </div>
              </div>

              {/* Payment mode */}
              {selectedPlan?.allowedPaymentModes?.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Mode</label>
                  <div className="flex gap-2">
                    {selectedPlan.allowedPaymentModes.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          paymentMode === mode
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {mode === 'upfront' ? 'Pay Upfront' : 'Pay As You Go'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upfront instances */}
              {paymentMode === 'upfront' && selectedPlan && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Number of Deliveries ({selectedPlan.minInstances || 2}–{selectedPlan.maxInstances || 24})
                  </label>
                  <input
                    type="number"
                    min={selectedPlan.minInstances || 2}
                    max={selectedPlan.maxInstances || 24}
                    value={instances}
                    onChange={(e) => setInstances(parseInt(e.target.value) || 2)}
                    className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* Summary */}
              <div className="bg-white border border-emerald-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">Summary</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-600">
                  <p>Delivery: {FREQ_LABELS[selectedPlan?.frequency] || ''}</p>
                  <p>Qty per delivery: {quantity} × {formatPrice ? formatPrice(price) : `R${price.toFixed(2)}`}</p>
                  {paymentMode === 'upfront' ? (
                    <>
                      <p>Total deliveries: {instances}</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        Total upfront: {formatPrice ? formatPrice(totalUpfront) : `R${totalUpfront.toFixed(2)}`}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">You'll be reminded before each delivery and billed per order</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isLoading}
                className="w-full py-3 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isLoading ? 'Setting up...' : 'Set Up Recurring Purchase'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Success state */}
      {isOpen && submitted && (
        <div className="mt-3 border border-green-200 rounded-xl p-5 bg-green-50 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-semibold text-green-800">Recurring order set up!</p>
          <p className="text-xs text-green-600 mt-1">Manage it anytime in My Account → Recurring Orders</p>
          <button
            onClick={() => { setIsOpen(false); setSubmitted(false); }}
            className="mt-3 text-xs text-gray-500 underline hover:text-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
