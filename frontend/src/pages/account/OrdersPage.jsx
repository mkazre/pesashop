import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { IoCopy, IoCheckmark } from 'react-icons/io5';
import { ordersAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

const PAYMENT_STYLES = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  completed: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-purple-600',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const { formatPrice } = useCurrencyStore();

  const copyOrderNumber = (e, orderNumber) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopiedId(orderNumber);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const { data, isLoading } = useQuery(
    ['myOrders', statusFilter],
    () => ordersAPI.getAll(statusFilter ? { status: statusFilter } : {}),
    { retry: 1 }
  );

  const orders = data?.data?.data || data?.data || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
        <p className="text-gray-500 mt-3">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <p className="text-gray-500 font-medium">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">When you place an order, it will appear here.</p>
          <Link to="/shop" className="inline-block mt-4 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/account/orders/${order._id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                      #{order.orderNumber}
                      <button
                        onClick={(e) => copyOrderNumber(e, order.orderNumber)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                        title="Copy order number"
                      >
                        {copiedId === order.orderNumber ? <IoCheckmark size={14} className="text-green-500" /> : <IoCopy size={14} />}
                      </button>
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status?.replace('-', ' ')}
                    </span>
                    {order.isLaybye && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                        Laybye
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Items summary */}
                <div className="text-sm text-gray-600 mb-3">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="text-gray-400"> +{order.items.length - 3} more</span>
                  )}
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Payment: <span className={`font-medium capitalize ${PAYMENT_STYLES[order.paymentStatus] || 'text-gray-600'}`}>{order.paymentStatus}</span>
                    </span>
                    <span className="text-gray-500">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(order.total || 0)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
