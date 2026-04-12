import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recurringOrdersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import { IoRefresh, IoStop, IoPaperPlane, IoEye, IoCalendar, IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  active: 'badge-success',
  paused: 'badge-warning',
  cancelled: 'badge-error',
  completed: 'badge-ghost'
};

const FREQ_LABELS = {
  daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly',
  monthly: 'Monthly', bimonthly: 'Every 2 Months', quarterly: 'Quarterly'
};

const RecurringOrdersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', paymentMode: '', frequency: '', page: 1, limit: 20 });

  const { data, isLoading } = useQuery(
    ['recurring-orders-admin', filters],
    () => recurringOrdersAPI.getAll(filters),
    { keepPreviousData: true }
  );

  const cancelMutation = useMutation(({ id, reason }) => recurringOrdersAPI.cancel(id, reason), {
    onSuccess: () => { queryClient.invalidateQueries('recurring-orders-admin'); toast.success('Recurring order cancelled.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cancel failed')
  });

  const reminderMutation = useMutation((id) => recurringOrdersAPI.sendReminder(id), {
    onSuccess: () => toast.success('Reminder sent.'),
    onError: (e) => toast.error(e.response?.data?.message || 'Send failed')
  });

  const orders = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleCancel = (id, name) => {
    const reason = window.prompt(`Cancellation reason for ${name}:`);
    if (reason === null) return;
    cancelMutation.mutate({ id, reason });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recurring Orders</h1>
          <p className="text-sm text-gray-500">Manage all customer recurring purchase subscriptions</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/recurring-orders/plans')}
        >
          <IoCalendar size={16} className="mr-2" /> Manage Plans
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Status', key: 'status', options: [['', 'All Status'], ['active', 'Active'], ['paused', 'Paused'], ['cancelled', 'Cancelled'], ['completed', 'Completed']] },
          { label: 'Payment Mode', key: 'paymentMode', options: [['', 'All Modes'], ['upfront', 'Upfront'], ['pay_as_you_go', 'Pay As You Go']] },
          { label: 'Frequency', key: 'frequency', options: [['', 'All Frequencies'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['monthly', 'Monthly'], ['bimonthly', 'Bimonthly'], ['quarterly', 'Quarterly']] },
        ].map(f => (
          <select
            key={f.key}
            className="select select-bordered select-sm"
            value={filters[f.key]}
            onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: e.target.value, page: 1 }))}
          >
            {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <IoRefresh size={48} className="text-gray-200" />
            <p className="text-gray-400">No recurring orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Frequency</th>
                  <th>Mode</th>
                  <th>Next Delivery</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ro) => {
                  const nextDelivery = ro.nextDeliveryDate ? new Date(ro.nextDeliveryDate).toLocaleDateString('en-ZA') : '—';
                  const isOverdue = ro.nextDeliveryDate && new Date(ro.nextDeliveryDate) < new Date() && ro.status === 'active';

                  return (
                    <tr key={ro._id} className="hover">
                      <td>
                        <div>
                          <p className="font-medium text-sm">{ro.customer?.firstName} {ro.customer?.lastName}</p>
                          <p className="text-xs text-gray-500">{ro.customer?.email}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {ro.product?.featuredImage && (
                            <img src={ro.product.featuredImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800 max-w-[160px] truncate">{ro.productName || ro.product?.name}</p>
                            <p className="text-xs text-gray-500">Qty: {ro.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-700">{FREQ_LABELS[ro.frequency] || ro.frequency}</span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${ro.paymentMode === 'upfront' ? 'badge-info' : 'badge-ghost'}`}>
                          {ro.paymentMode === 'upfront' ? 'Upfront' : 'Pay As You Go'}
                        </span>
                      </td>
                      <td>
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {nextDelivery} {isOverdue && '⚠️'}
                        </span>
                      </td>
                      <td>
                        {ro.paymentMode === 'upfront' ? (
                          <div>
                            <p className="text-xs text-gray-600">
                              {ro.completedInstances}/{ro.totalInstances} delivered
                            </p>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${ro.totalInstances ? (ro.completedInstances / ro.totalInstances) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">{ro.completedInstances} delivered</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_STYLES[ro.status] || 'badge-ghost'}`}>
                          {ro.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            title="View detail"
                            onClick={() => navigate(`/recurring-orders/${ro._id}`)}
                          ><IoEye size={14} /></button>
                          {ro.status === 'active' && (
                            <>
                              <button
                                className="btn btn-ghost btn-xs btn-square"
                                title="Send reminder"
                                onClick={() => reminderMutation.mutate(ro._id)}
                              ><IoPaperPlane size={14} /></button>
                              <button
                                className="btn btn-ghost btn-xs btn-square text-red-500"
                                title="Cancel"
                                onClick={() => handleCancel(ro._id, ro.productName)}
                              ><IoStop size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">
                  {pagination.total} orders
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-ghost"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  >← Prev</button>
                  <span className="btn btn-sm btn-ghost pointer-events-none">
                    {filters.page} / {pagination.pages}
                  </span>
                  <button
                    className="btn btn-sm btn-ghost"
                    disabled={filters.page >= pagination.pages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecurringOrdersPage;
