import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { ordersAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Input from '@/components/common/Input';
import { IoSearch, IoEye, IoChevronDown, IoWallet } from 'react-icons/io5';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['orders', page, search, statusFilter, paymentFilter],
    () => ordersAPI.getAll({ 
      page, 
      limit: 20, 
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      paymentStatus: paymentFilter || undefined
    }),
    { keepPreviousData: true }
  );

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-gray-100 text-gray-800 border-gray-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const columns = [
    {
      key: 'orderNumber',
      title: 'Order',
      width: '120px',
      render: (num, row) => (
        <div>
          <a
            href={`#`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/orders/${row._id}`);
            }}
            className="font-medium text-primary hover:underline"
          >
            #{num}
          </a>
          {row.items && row.items.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {row.items.length} item{row.items.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      width: '200px',
      render: (customer, row) => (
        <div>
          <div className="font-medium">
            {customer?.firstName} {customer?.lastName}
          </div>
          {customer?.email && (
            <div className="text-xs text-gray-500">{customer.email}</div>
          )}
          {row.billingAddress?.email && !customer?.email && (
            <div className="text-xs text-gray-500">{row.billingAddress.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      width: '140px',
      render: (date) => (
        <div>
          <div className="text-sm">{new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div className="text-xs text-gray-500">{new Date(date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '140px',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      title: 'Payment Method',
      width: '150px',
      render: (method, row) => {
        const paymentMethods = [];
        
        // Check for gift cards
        if (row.giftCardsApplied && row.giftCardsApplied.length > 0) {
          const giftCardTotal = row.giftCardsApplied.reduce((sum, gc) => sum + (gc.amount || 0), 0);
          paymentMethods.push(`Gift Card (R${giftCardTotal.toFixed(2)})`);
        }
        
        // Check for coupons
        if (row.couponsApplied && row.couponsApplied.length > 0) {
          const couponTotal = row.couponsApplied.reduce((sum, cp) => sum + (cp.discount || 0), 0);
          paymentMethods.push(`Coupon (R${couponTotal.toFixed(2)})`);
        }
        
        // Check for PESA Coins
        if (row.loyaltyPointsUsed && row.loyaltyPointsUsed > 0) {
          paymentMethods.push(`Points (${row.loyaltyPointsUsed})`);
        }
        
        // Add primary payment method
        if (method) {
          const methodLabels = {
            'card': 'Card',
            'cod': 'Cash on Delivery',
            'paypal': 'PayPal',
            'gift_card': 'Gift Card',
            'eft': 'EFT',
            'bank_transfer': 'Bank Transfer',
            'cash': 'Cash'
          };
          const methodLabel = methodLabels[method] || method;
          if (!paymentMethods.some(pm => pm.includes(methodLabel))) {
            paymentMethods.push(methodLabel);
          }
        }
        
        return (
          <div className="space-y-1">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((pm, idx) => (
                <div key={idx} className="text-xs text-gray-700">
                  {pm}
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-500">-</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'paymentStatus',
      title: 'Payment Status',
      width: '120px',
      render: (status) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'total',
      title: 'Total',
      width: '120px',
      align: 'right',
      render: (total, row) => (
        <div className="text-right">
          <div className="font-medium">R {total.toFixed(2)}</div>
          {row.currency && row.currency !== 'ZAR' && (
            <div className="text-xs text-gray-500">{row.currency}</div>
          )}
        </div>
      ),
    },
    {
      key: 'isLaybye',
      title: 'Laybye',
      width: '100px',
      align: 'center',
      render: (isLaybye, row) => (
        <div className="flex items-center justify-center">
          {isLaybye || row.laybye ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <IoWallet size={14} className="mr-1" />
              Yes
            </span>
          ) : (
            <span className="text-gray-400 text-xs">No</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '80px',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${row._id}`);
          }}
          className="p-2 hover:bg-gray-100 transition-colors rounded"
          title="View Order"
        >
          <IoEye size={18} className="text-primary" />
        </button>
      ),
    },
  ];

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' }
  ];

  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  // Extract orders from API response
  const orders = useMemo(() => {
    if (!data) return [];
    const serverResponse = data.data || data;
    if (serverResponse?.data && Array.isArray(serverResponse.data)) {
      return serverResponse.data;
    }
    if (Array.isArray(serverResponse)) {
      return serverResponse;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }, [data]);
  const pagination = data?.data?.pagination || {
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    pages: data?.data?.pages || 1,
    limit: 20
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="text-sm text-gray-600">
          {pagination.total !== undefined && (
            <span>{pagination.total} order{pagination.total !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <Card>
        {/* Filters - WooCommerce Style */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders by order number, customer name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pr-8 appearance-none"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="input pr-8 appearance-none"
              >
                <option value="">All Payment Statuses</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="p-8 text-center">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders found. {search && 'Try adjusting your search filters.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left py-3 px-4 font-medium text-sm text-gray-700 ${
                        col.align === 'right' ? 'text-right' : ''
                      }`}
                      style={{ width: col.width }}
                    >
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-3 px-4 ${
                          col.align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {col.render
                          ? col.render(order[col.key], order)
                          : order[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - WooCommerce Style */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * (pagination.limit || 20)) + 1} to {Math.min(page * (pagination.limit || 20), pagination.total || 0)} of {pagination.total || 0} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </Card>
    </div>
  );
};

export default OrdersPage;
