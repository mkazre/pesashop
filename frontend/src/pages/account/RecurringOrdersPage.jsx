import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurringOrdersAPI } from '@/services/api';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
};

const FREQ_LABELS = {
  daily: 'Daily', weekly: 'Weekly', fortnightly: 'Every 2 weeks',
  monthly: 'Monthly', bimonthly: 'Every 2 months', quarterly: 'Every 3 months',
};

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <p className="text-gray-800 text-sm">{message}</p>
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function RecurringOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null); // { action, id, message }

  const { data, isLoading } = useQuery(
    ['my-recurring-orders', statusFilter],
    () => recurringOrdersAPI.getMine({ status: statusFilter || undefined }),
    { staleTime: 30000 }
  );
  const orders = data?.data?.data || [];

  const pauseMutation = useMutation((id) => recurringOrdersAPI.pause(id), {
    onSuccess: () => { queryClient.invalidateQueries('my-recurring-orders'); setConfirm(null); }
  });
  const resumeMutation = useMutation((id) => recurringOrdersAPI.resume(id), {
    onSuccess: () => { queryClient.invalidateQueries('my-recurring-orders'); setConfirm(null); }
  });
  const cancelMutation = useMutation((id) => recurringOrdersAPI.cancel(id, ''), {
    onSuccess: () => { queryClient.invalidateQueries('my-recurring-orders'); setConfirm(null); }
  });

  const handleAction = (action, order) => {
    const messages = {
      pause: `Pause recurring delivery of ${order.productName || 'this product'}?`,
      resume: `Resume recurring delivery of ${order.productName || 'this product'}?`,
      cancel: `Cancel your recurring subscription for ${order.productName || 'this product'}? This cannot be undone.`,
    };
    setConfirm({ action, id: order._id, message: messages[action] });
  };

  const executeAction = () => {
    if (!confirm) return;
    if (confirm.action === 'pause') pauseMutation.mutate(confirm.id);
    if (confirm.action === 'resume') resumeMutation.mutate(confirm.id);
    if (confirm.action === 'cancel') cancelMutation.mutate(confirm.id);
  };

  return (
    <div className="space-y-4">
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={executeAction}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">Recurring Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your automatic repeat deliveries</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['active', 'Active'], ['paused', 'Paused'], ['cancelled', 'Cancelled'], ['completed', 'Completed']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === val
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-block w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-gray-600 font-medium">No recurring orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Set up a recurring purchase on any product page</p>
          <Link to="/shop" className="mt-4 inline-block px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const nextDelivery = order.nextDeliveryDate
              ? new Date(order.nextDeliveryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
              : null;
            const isOverdue = order.nextDeliveryDate && new Date(order.nextDeliveryDate) < new Date() && order.status === 'active';

            return (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  {order.product?.featuredImage && (
                    <img src={order.product.featuredImage} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{order.productName || order.product?.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Qty {order.quantity} · {FREQ_LABELS[order.frequency] || order.frequency}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {nextDelivery && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue ? '⚠️ Overdue · ' : '📦 Next · '}
                          {nextDelivery}
                        </span>
                      )}
                      {order.paymentMode === 'upfront' && (
                        <span>
                          {order.completedInstances}/{order.totalInstances} delivered
                        </span>
                      )}
                      {order.paymentMode === 'pay_as_you_go' && (
                        <span>{order.completedInstances} delivered</span>
                      )}
                    </div>

                    {/* Upfront progress bar */}
                    {order.paymentMode === 'upfront' && order.totalInstances > 0 && (
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gray-900 h-1.5 rounded-full"
                          style={{ width: `${(order.completedInstances / order.totalInstances) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    {order.status === 'active' && (
                      <button
                        onClick={() => handleAction('pause', order)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {order.status === 'paused' && (
                      <button
                        onClick={() => handleAction('resume', order)}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleAction('cancel', order)}
                      className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
