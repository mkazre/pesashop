import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceProvidersAPI } from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending_payment: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
  expired: 'bg-gray-100 text-gray-400',
  cancelled: 'bg-gray-100 text-gray-500',
};

const DURATION_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const PAYMENT_LABELS = {
  eft: 'EFT',
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
};

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'active', label: 'Active' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
];

export default function ServiceProviderAdOrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data, isLoading } = useQuery(
    ['sp-ad-orders', statusFilter, page],
    () => serviceProvidersAPI.getAdOrders({ status: statusFilter || undefined, page, limit }).then(r => r.data),
    { keepPreviousData: true }
  );

  const orders = data?.data || [];
  const pagination = data?.pagination || {};
  const stats = data?.stats || {};

  const activateMutation = useMutation(
    (id) => serviceProvidersAPI.activateAdOrder(id),
    {
      onSuccess: () => {
        qc.invalidateQueries('sp-ad-orders');
        toast.success('Order activated. Provider subscription updated.');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Activation failed'),
    }
  );

  const declineMutation = useMutation(
    ({ id, reason }) => serviceProvidersAPI.declineAdOrder(id, reason),
    {
      onSuccess: () => {
        qc.invalidateQueries('sp-ad-orders');
        toast.success('Order declined.');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Decline failed'),
    }
  );

  const handleActivate = (order) => {
    if (window.confirm(`Activate order for ${order.provider?.businessName}?\n\nSlot: ${order.slotLabel}\nTotal: R${order.totalAmount?.toLocaleString()}\n\nThis will set the provider subscription to ACTIVE until ${order.endDate ? new Date(order.endDate).toLocaleDateString() : 'N/A'}.`)) {
      activateMutation.mutate(order._id);
    }
  };

  const handleDecline = (order) => {
    const reason = window.prompt(`Decline reason for ${order.provider?.businessName}'s order:`, '');
    if (reason === null) return;
    declineMutation.mutate({ id: order._id, reason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage provider ad slot bookings — activate after payment is confirmed</p>
        </div>
        <div className="text-sm text-gray-500">{pagination.total || 0} total orders</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Pending Payment</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingCount ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Awaiting confirmation</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Active Orders</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeCount ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Currently running</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Revenue (Active)</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">R{(stats.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">From active orders</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">No ad orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.provider?.businessName || '—'}</p>
                      <p className="text-xs text-gray-400">{order.provider?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800">{order.slotLabel || order.slotId}</p>
                      {order.slotPage && <p className="text-xs text-gray-400">{order.slotPage}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{DURATION_LABELS[order.durationType] || order.durationType}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.quantity}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">R{(order.totalAmount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">@ R{(order.unitPrice || 0).toLocaleString()} each</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-500'}`}>
                        {order.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      {order.status === 'active' && order.endDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Until {new Date(order.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                      {order.status === 'declined' && order.declineReason && (
                        <p className="text-xs text-red-400 mt-0.5 max-w-[120px] truncate" title={order.declineReason}>
                          {order.declineReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {order.status === 'pending_payment' && (
                          <>
                            <button
                              onClick={() => handleActivate(order)}
                              disabled={activateMutation.isLoading}
                              className="text-xs text-green-600 hover:text-green-700 font-semibold disabled:opacity-50"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => handleDecline(order)}
                              disabled={declineMutation.isLoading}
                              className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {order.notes && (
                          <span
                            className="text-xs text-gray-400 cursor-help"
                            title={order.notes}
                          >
                            📝 Note
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > limit && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
