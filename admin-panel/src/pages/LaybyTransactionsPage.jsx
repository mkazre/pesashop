import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { laybyTransactionsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { IoWallet, IoTrendingUp, IoTrendingDown, IoSwapHorizontal } from 'react-icons/io5';

const LaybyTransactionsPage = () => {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['laybyTransactions', page, typeFilter, statusFilter],
    () => laybyTransactionsAPI.getAll({ page, limit: 50, type: typeFilter, status: statusFilter }),
    { keepPreviousData: true }
  );

  const transactions = data?.data?.data || [];
  const summary = data?.data?.summary || {};
  const totalPages = data?.data?.pages || 1;

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Deposit',
      installment: 'Installment',
      late_fee: 'Late Fee',
      cancellation_fee: 'Cancellation Fee',
      refund: 'Refund',
      adjustment: 'Adjustment',
      write_off: 'Write Off',
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type) => {
    const styles = {
      deposit: 'badge-info',
      installment: 'badge-success',
      late_fee: 'badge-warning',
      cancellation_fee: 'badge-error',
      refund: 'badge-primary',
      adjustment: 'badge-info',
      write_off: 'badge-error',
    };
    return styles[type] || '';
  };

  const columns = [
    {
      key: 'createdAt',
      title: 'Date',
      width: '140px',
      render: (date) => (
        <div>
          <p className="text-sm">{new Date(date).toLocaleDateString('en-ZA')}</p>
          <p className="text-xs text-gray-400">{new Date(date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (customer) => customer ? (
        <div>
          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
      ) : <span className="text-gray-400">N/A</span>,
    },
    {
      key: 'type',
      title: 'Type',
      width: '130px',
      render: (type) => (
        <span className={`badge ${getTypeBadge(type)}`}>{getTypeLabel(type)}</span>
      ),
    },
    {
      key: 'amount',
      title: 'Amount',
      width: '120px',
      render: (amount) => (
        <span className={`font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {amount >= 0 ? '+' : ''}R {Math.abs(amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      title: 'Balance After',
      width: '120px',
      render: (bal) => `R ${(bal || 0).toFixed(2)}`,
    },
    {
      key: 'paymentMethod',
      title: 'Method',
      width: '100px',
      render: (method) => <span className="capitalize text-sm">{method || '-'}</span>,
    },
    {
      key: 'source',
      title: 'Source',
      width: '80px',
      render: (source) => <span className="capitalize text-sm text-gray-500">{source || '-'}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      width: '100px',
      render: (status) => (
        <span className={`badge ${
          status === 'completed' ? 'badge-success' :
          status === 'failed' ? 'badge-error' :
          status === 'reversed' ? 'badge-warning' :
          'badge-info'
        }`}>
          {status}
        </span>
      ),
    },
    {
      key: 'note',
      title: 'Note',
      render: (note) => note ? (
        <p className="text-sm text-gray-600 truncate max-w-[200px]" title={note}>{note}</p>
      ) : <span className="text-gray-300">-</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Log</h1>
        <p className="text-sm text-gray-500 mt-1">Master log of all layby transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-green-600">R {(summary.totalReceived || 0).toFixed(2)}</p>
            </div>
            <IoTrendingUp size={28} className="text-green-200" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Refunded</p>
              <p className="text-2xl font-bold text-red-600">R {(summary.totalRefunded || 0).toFixed(2)}</p>
            </div>
            <IoTrendingDown size={28} className="text-red-200" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-primary">
                R {((summary.totalReceived || 0) - (summary.totalRefunded || 0)).toFixed(2)}
              </p>
            </div>
            <IoWallet size={28} className="text-primary opacity-20" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-primary">{summary.totalTransactions || 0}</p>
            </div>
            <IoSwapHorizontal size={28} className="text-primary opacity-20" />
          </div>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="mb-4 flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="installment">Installment</option>
            <option value="late_fee">Late Fee</option>
            <option value="cancellation_fee">Cancellation Fee</option>
            <option value="refund">Refund</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>

        <Table columns={columns} data={transactions} loading={isLoading} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LaybyTransactionsPage;
