import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { laybyesAPI } from '@/services/api';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import { IoArrowBack, IoWallet, IoCheckmark, IoClose, IoCalendar, IoReceipt } from 'react-icons/io5';

const LaybyeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', paymentMethod: '', transactionId: '', note: '' });
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [keepDeposit, setKeepDeposit] = useState(false);

  const { data, isLoading } = useQuery(
    ['laybye', id],
    () => laybyesAPI.getOne(id),
    { enabled: !!id }
  );

  const recordPaymentMutation = useMutation(
    (data) => laybyesAPI.recordPayment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['laybye', id]);
        toast.success('Payment recorded successfully');
        setPaymentModal(false);
        setPaymentData({ amount: '', paymentMethod: '', transactionId: '', note: '' });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record payment');
      },
    }
  );

  const updatePaymentStatusMutation = useMutation(
    ({ paymentId, status }) => laybyesAPI.updatePaymentStatus(id, paymentId, { status }),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(['laybye', id]);
        toast.success(res.data?.message || 'Payment status updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update payment status');
      },
    }
  );

  const cancelMutation = useMutation(
    (data) => laybyesAPI.cancel(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['laybye', id]);
        toast.success('Laybye cancelled successfully');
        setCancelModal(false);
        setCancelReason('');
        setKeepDeposit(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel laybye');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading laybye details...</p>
        </div>
      </div>
    );
  }

  const laybye = data?.data?.data || data?.data;
  
  if (!laybye) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/laybyes')}>
          <IoArrowBack size={20} />
          Back to Laybyes
        </Button>
        <Card>
          <div className="p-8 text-center text-gray-500">
            Laybye not found
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'defaulted': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/laybyes')}>
            <IoArrowBack size={20} />
            Back to Laybyes
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Laybye #{laybye._id?.slice(-8) || 'N/A'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(laybye.createdAt).toLocaleString('en-ZA')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(laybye.status)}`}>
            {laybye.status?.charAt(0).toUpperCase() + laybye.status?.slice(1)}
          </span>
          {laybye.isExpired && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-red-100 text-red-800 border-red-200">
              Expired
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          {laybye.order && (
            <Card title="Related Order">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Order Number</p>
                      <p className="text-lg font-bold text-primary">
                        #{laybye.order.orderNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Order Total</p>
                      <p className="text-lg font-bold">
                        R {laybye.order.total?.toFixed(2) || laybye.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  {laybye.order.customer && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">
                        {laybye.order.customer.firstName} {laybye.order.customer.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{laybye.order.customer.email}</p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Order Status</p>
                    <p className="font-medium capitalize">{laybye.order.status || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/orders/${laybye.order._id || laybye.order}`)}
                  >
                    <IoReceipt size={18} className="mr-2" />
                    View Full Order Details →
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Plan */}
          <Card title="Payment Plan">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold">R {laybye.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deposit Amount</p>
                  <p className="text-xl font-bold text-blue-600">R {laybye.depositAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-xl font-bold text-green-600">R {laybye.paidAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-xl font-bold text-red-600">R {laybye.remainingAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Installment Plan</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="font-medium capitalize">{laybye.installmentPlan?.frequency || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Number of Payments</p>
                    <p className="font-medium">{laybye.installmentPlan?.numberOfPayments || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Installment Amount</p>
                    <p className="font-medium">R {laybye.installmentPlan?.installmentAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
              {laybye.nextPaymentDate && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Next Payment Date</p>
                  <p className="font-medium">
                    {new Date(laybye.nextPaymentDate).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {new Date(laybye.nextPaymentDate) < new Date() && laybye.status === 'active' && (
                    <p className="text-sm text-red-600 mt-1">⚠️ Overdue</p>
                  )}
                </div>
              )}
              {laybye.expiryDate && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">
                    {new Date(laybye.expiryDate).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment History */}
          <Card title="Payment History">
            {laybye.payments && laybye.payments.length > 0 ? (
              <div className="space-y-3">
                {laybye.payments.map((payment, index) => {
                  const isPending = payment.status === 'pending';
                  return (
                    <div key={payment._id || index} className={`p-4 border rounded-lg ${isPending ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">R {payment.amount?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentDate 
                              ? new Date(payment.paymentDate).toLocaleDateString('en-ZA')
                              : 'N/A'}
                          </p>
                          {payment.paymentMethod && (
                            <p className="text-xs text-gray-500">Method: {payment.paymentMethod}</p>
                          )}
                          {payment.transactionId && (
                            <p className="text-xs text-gray-500">Transaction: {payment.transactionId}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      {payment.note && (
                        <p className="text-sm text-gray-600 mt-2">{payment.note}</p>
                      )}
                      {isPending && payment._id && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-yellow-200">
                          <span className="text-xs text-yellow-700 font-medium mr-auto">Awaiting verification</span>
                          <Button
                            size="sm"
                            onClick={() => updatePaymentStatusMutation.mutate({ paymentId: payment._id, status: 'completed' })}
                            disabled={updatePaymentStatusMutation.isLoading}
                          >
                            <IoCheckmark size={16} className="mr-1" />
                            Confirm
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => updatePaymentStatusMutation.mutate({ paymentId: payment._id, status: 'failed' })}
                            disabled={updatePaymentStatusMutation.isLoading}
                          >
                            <IoClose size={16} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No payments recorded yet</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-3">
              {laybye.status === 'active' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setPaymentData({
                        amount: laybye.installmentPlan?.installmentAmount?.toFixed(2) || '',
                        paymentMethod: '',
                        transactionId: '',
                        note: ''
                      });
                      setPaymentModal(true);
                    }}
                  >
                    <IoWallet size={18} className="mr-2" />
                    Record Payment
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setCancelModal(true)}
                  >
                    <IoClose size={18} className="mr-2" />
                    Cancel Laybye
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          {laybye.customer && (
            <Card title="Customer">
              <div className="space-y-2">
                <p className="font-medium">
                  {laybye.customer.firstName} {laybye.customer.lastName}
                </p>
                {laybye.customer.email && (
                  <p className="text-sm text-gray-600">{laybye.customer.email}</p>
                )}
                {laybye.customer.phone && (
                  <p className="text-sm text-gray-600">{laybye.customer.phone}</p>
                )}
              </div>
            </Card>
          )}

          {/* Plan Info */}
          {laybye.laybyPlan && (
            <Card title="Layby Plan">
              <div className="space-y-2">
                <p className="font-medium">{laybye.laybyPlan.name}</p>
                {laybye.laybyPlan.description && (
                  <p className="text-sm text-gray-600">{laybye.laybyPlan.description}</p>
                )}
              </div>
            </Card>
          )}

          {/* Notes */}
          {(laybye.notes || laybye.adminNotes) && (
            <Card title="Notes">
              <div className="space-y-3">
                {laybye.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Customer Notes</p>
                    <p className="text-sm">{laybye.notes}</p>
                  </div>
                )}
                {laybye.adminNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Admin Notes</p>
                    <p className="text-sm">{laybye.adminNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => {
          setPaymentModal(false);
          setPaymentData({ amount: '', paymentMethod: '', transactionId: '', note: '' });
        }}
        title="Record Payment"
        onConfirm={() => {
          recordPaymentMutation.mutate({
            amount: parseFloat(paymentData.amount),
            paymentMethod: paymentData.paymentMethod || 'manual',
            transactionId: paymentData.transactionId,
            note: paymentData.note
          });
        }}
        confirmText="Record Payment"
        confirmLoading={recordPaymentMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (R) *</label>
            <Input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <Input
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              placeholder="e.g., Cash, Bank Transfer, Credit Card"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Transaction ID</label>
            <Input
              value={paymentData.transactionId}
              onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Note</label>
            <textarea
              value={paymentData.note}
              onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
              rows={3}
              className="input w-full resize-none"
              placeholder="Optional payment note"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel Laybye Modal */}
      <Modal
        isOpen={cancelModal}
        onClose={() => {
          setCancelModal(false);
          setCancelReason('');
          setKeepDeposit(false);
        }}
        title="Cancel Laybye"
        onConfirm={() => {
          if (!cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
          }
          cancelMutation.mutate({
            reason: cancelReason,
            keepDeposit
          });
        }}
        confirmText="Cancel Laybye"
        confirmLoading={cancelMutation.isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cancellation Reason *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="input w-full resize-none"
              placeholder="Enter reason for cancellation"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={keepDeposit}
              onChange={(e) => setKeepDeposit(e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <label className="text-sm font-medium">Keep deposit on cancellation</label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LaybyeDetailPage;
