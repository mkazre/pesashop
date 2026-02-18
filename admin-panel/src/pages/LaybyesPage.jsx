import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { laybyesAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { IoWallet, IoCheckmark, IoClose, IoCalendar, IoEye } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const LaybyesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLaybye, setSelectedLaybye] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { data, isLoading } = useQuery(
    ['laybyes', page, statusFilter],
    () => laybyesAPI.getAll({ page, limit: 20, status: statusFilter }),
    { keepPreviousData: true }
  );

  const recordPaymentMutation = useMutation(
    ({ id, data }) => laybyesAPI.recordPayment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyes');
        toast.success('Payment recorded successfully');
        setPaymentModal(null);
        setPaymentAmount('');
      },
      onError: () => {
        toast.error('Failed to record payment');
      },
    }
  );

  const cancelMutation = useMutation(
    ({ id, reason }) => laybyesAPI.cancel(id, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('laybyes');
        toast.success('Laybye cancelled');
        setSelectedLaybye(null);
      },
      onError: () => {
        toast.error('Failed to cancel laybye');
      },
    }
  );

  const columns = [
    {
      key: 'order',
      title: 'Order #',
      width: '150px',
      render: (order, row) => {
        const orderId = order?._id || (typeof row.order === 'object' ? row.order?._id : row.order);
        const orderNumber = order?.orderNumber || (typeof row.order === 'object' ? row.order?.orderNumber : null);
        
        return orderNumber ? (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (orderId) {
                navigate(`/orders/${orderId}`);
              }
            }}
            className="font-medium text-primary hover:underline"
          >
            #{orderNumber}
          </a>
        ) : (
          <span className="font-medium text-gray-400">N/A</span>
        );
      },
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (customer) => `${customer?.firstName} ${customer?.lastName}`,
    },
    {
      key: 'totalAmount',
      title: 'Total',
      width: '120px',
      render: (amount) => `R ${amount.toFixed(2)}`,
    },
    {
      key: 'paidAmount',
      title: 'Paid',
      width: '120px',
      render: (amount) => `R ${amount.toFixed(2)}`,
    },
    {
      key: 'remainingAmount',
      title: 'Remaining',
      width: '120px',
      render: (amount) => <span className="font-medium text-red-600">R {amount.toFixed(2)}</span>,
    },
    {
      key: 'nextPaymentDate',
      title: 'Next Payment',
      width: '130px',
      render: (date, row) => {
        if (row.status !== 'active') return '-';
        const isOverdue = new Date(date) < new Date();
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      width: '120px',
      render: (status) => (
        <span className={`badge ${
          status === 'active' ? 'badge-info' :
          status === 'completed' ? 'badge-success' :
          status === 'cancelled' ? 'badge-error' :
          'badge-warning'
        }`}>
          {status}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (row._id) {
                navigate(`/laybyes/${row._id}`);
              }
            }}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
            title="View Details"
          >
            <IoEye size={18} className="text-primary" />
          </button>
          {row.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPaymentModal(row);
                setPaymentAmount(row.installmentPlan.installmentAmount.toString());
              }}
              className="p-2 hover:bg-gray-100 transition-colors"
              title="Record Payment"
            >
              <IoCheckmark size={18} className="text-green-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleRecordPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    recordPaymentMutation.mutate({
      id: paymentModal._id,
      data: {
        amount: parseFloat(paymentAmount),
        method: 'manual',
        transactionId: `TXN-${Date.now()}`,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Laybyes (Installment Plans)</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-primary">
                {data?.data?.data?.filter(l => l.status === 'active').length || 0}
              </p>
            </div>
            <IoWallet size={32} className="text-primary opacity-20" />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600">
            R {data?.data?.data
              ?.filter(l => l.status === 'active')
              .reduce((sum, l) => sum + l.remainingAmount, 0)
              .toFixed(2) || '0.00'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Overdue Payments</p>
          <p className="text-2xl font-bold text-red-600">
            {data?.data?.data?.filter(l => 
              l.status === 'active' && new Date(l.nextPaymentDate) < new Date()
            ).length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {data?.data?.data?.filter(l => l.status === 'completed').length || 0}
          </p>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="defaulted">Defaulted</option>
          </select>
        </div>

        {/* Laybyes Table */}
        <Table
          columns={columns}
          data={data?.data?.data || []}
          loading={isLoading}
          onRowClick={(row) => navigate(`/laybyes/${row._id}`)}
        />

        {/* Pagination */}
        {data?.data?.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">Page {page} of {data.data.pages}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="ghost" disabled={page === data.data.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Laybye Details Modal */}
      <Modal
        isOpen={!!selectedLaybye}
        onClose={() => setSelectedLaybye(null)}
        title="Laybye Details"
        size="lg"
        showFooter={false}
      >
        {selectedLaybye && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-medium">#{selectedLaybye.order?.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">
                  {selectedLaybye.customer?.firstName} {selectedLaybye.customer?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium">R {selectedLaybye.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deposit Paid</p>
                <p className="font-medium">R {selectedLaybye.depositAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="font-medium text-green-600">R {selectedLaybye.paidAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="font-medium text-red-600">R {selectedLaybye.remainingAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Installment Plan */}
            <div>
              <h3 className="font-semibold mb-3">Installment Plan</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-medium capitalize">{selectedLaybye.installmentPlan.frequency}</p>
                </div>
                <div className="p-3 bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Installment Amount</p>
                  <p className="font-medium">R {selectedLaybye.installmentPlan.installmentAmount.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-50 border-2 border-gray-200">
                  <p className="text-sm text-gray-600">Payments</p>
                  <p className="font-medium">
                    {selectedLaybye.payments.filter(p => p.status === 'completed').length} / {selectedLaybye.installmentPlan.numberOfPayments}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="font-semibold mb-3">Payment History</h3>
              <div className="border-2 border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Method</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLaybye.payments.map((payment, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium">R {payment.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm">{payment.paymentMethod || '-'}</td>
                        <td className="px-4 py-2">
                          <span className={`badge ${
                            payment.status === 'completed' ? 'badge-success' :
                            payment.status === 'failed' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            {selectedLaybye.status === 'active' && (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    setPaymentModal(selectedLaybye);
                    setPaymentAmount(selectedLaybye.installmentPlan.installmentAmount.toString());
                  }}
                >
                  <IoCheckmark size={20} className="mr-2" />
                  Record Payment
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const reason = prompt('Cancellation reason:');
                    if (reason) {
                      cancelMutation.mutate({ id: selectedLaybye._id, reason });
                    }
                  }}
                >
                  <IoClose size={20} className="mr-2" />
                  Cancel Plan
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentModal}
        onClose={() => {
          setPaymentModal(null);
          setPaymentAmount('');
        }}
        title="Record Payment"
        onConfirm={handleRecordPayment}
        confirmText="Record Payment"
        confirmLoading={recordPaymentMutation.isLoading}
      >
        {paymentModal && (
          <div className="space-y-4">
            <p>Recording payment for Order #{paymentModal.order?.orderNumber}</p>
            <Input
              label="Payment Amount (ZAR)"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              required
            />
            <div className="p-4 bg-gray-50 border-2 border-gray-200">
              <p className="text-sm text-gray-600">Remaining Balance</p>
              <p className="text-xl font-bold">R {paymentModal.remainingAmount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LaybyesPage;
