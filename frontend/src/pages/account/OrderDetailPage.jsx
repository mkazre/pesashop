import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import {
  IoCheckmarkCircleOutline,
  IoCardOutline,
  IoCubeOutline,
  IoAirplaneOutline,
  IoHomeOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function resolveImg(path) {
  if (!path) return '';
  if (typeof path === 'object' && path.url) return resolveImg(path.url);
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  'on-hold': 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

const JOURNEY_STEPS = [
  { key: 'placed',    label: 'Order Placed',       icon: IoCheckmarkCircleOutline, statusMatch: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'] },
  { key: 'confirmed', label: 'Payment Confirmed',  icon: IoCardOutline,            statusMatch: ['processing', 'on-hold', 'completed'] },
  { key: 'packing',   label: 'Packing',            icon: IoCubeOutline,            statusMatch: ['processing', 'completed'] },
  { key: 'shipped',   label: 'Shipped',            icon: IoAirplaneOutline,        statusMatch: ['completed'] },
  { key: 'delivered', label: 'Delivered',           icon: IoHomeOutline,            statusMatch: ['completed'] },
];

function getActiveStepIdx(order) {
  if (!order) return 0;
  const st = order.status;
  const ps = order.paymentStatus;
  if (st === 'completed') return 4;
  if (order.shippedAt || st === 'shipped') return 3;
  if (st === 'processing' && ps === 'completed') return 2;
  if (ps === 'completed' || ps === 'processing') return 1;
  return 0;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { formatPrice } = useCurrencyStore();

  const { data, isLoading, error } = useQuery(
    ['order', id],
    () => ordersAPI.getOne(id),
    { enabled: !!id, retry: 1 }
  );

  const order = data?.data?.data || data?.data;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
        <p className="text-gray-500 mt-3">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-red-500 font-medium">Order not found</p>
        <Link to="/account/orders" className="text-sm text-blue-600 hover:underline mt-2 inline-block">← Back to Orders</Link>
      </div>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const currentStepIdx = getActiveStepIdx(order);
  const sa = order.shippingAddress || {};
  const streetAddr = sa.street || sa.address || '';

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <Link to="/account/orders" className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Orders
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {order.status?.replace('-', ' ')}
            </span>
            {order.isLaybye && (
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800">Laybye</span>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Items ({order.items?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              {(() => {
                const imgSrc = resolveImg(item.product?.featuredImage || item.product?.images?.[0]);
                return imgSrc ? (
                  <img src={imgSrc} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                {item.variation && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {typeof item.variation === 'object' ? Object.entries(item.variation).map(([k, v]) => `${k}: ${v}`).join(', ') : item.variation}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-gray-500">
                  {item.salePrice ? (
                    <>
                      <span className="line-through text-gray-400 mr-1">{formatPrice(item.price)}</span>
                      {formatPrice(item.salePrice)}
                    </>
                  ) : (
                    formatPrice(item.price)
                  )}
                  {' × '}{item.quantity}
                </p>
                <p className="font-semibold text-gray-900">{formatPrice(item.total)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 px-5 py-4 space-y-2 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{formatPrice(order.subtotal || 0)}</span>
          </div>
          {order.shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping {order.shippingMethod && `(${order.shippingMethod})`}</span>
              <span className="text-gray-900">{formatPrice(order.shipping)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax {order.taxRate ? `(${order.taxRate}%)` : ''}</span>
              <span className="text-gray-900">{formatPrice(order.tax)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">-{formatPrice(order.discount)}</span>
            </div>
          )}
          {order.couponsApplied?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Coupons ({order.couponsApplied.map(c => c.code).join(', ')})</span>
              <span className="text-green-600">-{formatPrice(order.couponsApplied.reduce((s, c) => s + (c.discount || 0), 0))}</span>
            </div>
          )}
          {order.giftCardsApplied?.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gift Cards</span>
              <span className="text-green-600">-{formatPrice(order.giftCardsApplied.reduce((s, g) => s + (g.amount || 0), 0))}</span>
            </div>
          )}
          {order.loyaltyPointsUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">PESA Coins ({order.loyaltyPointsUsed} pts)</span>
              <span className="text-green-600">Applied</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(order.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Shipping Info */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Payment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-900 capitalize">{order.paymentMethodTitle || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium capitalize ${
                order.paymentStatus === 'completed' ? 'text-green-600' :
                order.paymentStatus === 'failed' ? 'text-red-600' :
                order.paymentStatus === 'refunded' ? 'text-purple-600' : 'text-yellow-600'
              }`}>{order.paymentStatus}</span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="text-gray-900 font-mono text-xs">{order.transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping — Vertical Order Tracking Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Shipping</h2>
          {order.trackingNumber && (
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking #</span>
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{order.trackingNumber}</a>
                ) : (
                  <span className="text-gray-900 font-mono text-xs">{order.trackingNumber}</span>
                )}
              </div>
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipped</span>
                  <span className="text-gray-900">{formatDate(order.shippedAt)}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivered</span>
                  <span className="text-green-600">{formatDate(order.deliveredAt)}</span>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            {JOURNEY_STEPS.map((step, i) => {
              const isActive = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3 relative" style={{ paddingBottom: i < JOURNEY_STEPS.length - 1 ? '16px' : 0 }}>
                  {i < JOURNEY_STEPS.length - 1 && (
                    <div
                      className="absolute left-[13px] top-[28px] w-[2px]"
                      style={{
                        height: 'calc(100% - 12px)',
                        backgroundColor: i < currentStepIdx ? '#10b981' : '#e5e7eb',
                      }}
                    />
                  )}
                  <div
                    className={`relative z-10 w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? 'bg-[#10b981] text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-3 ring-green-200' : ''}`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                    {isCurrent && <span className="text-xs text-green-600 font-medium ml-1.5">— Current</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid md:grid-cols-2 gap-4">
        {order.deliveryMethod === 'pickup' && order.pickupAddress && (order.pickupAddress.label || order.pickupAddress.address) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Pickup Location</h2>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-lg">🏪</span>
              <div>
                {order.pickupAddress.label && <p className="font-medium text-gray-900">{order.pickupAddress.label}</p>}
                {order.pickupAddress.address && <p className="text-gray-600">📍 {order.pickupAddress.address}</p>}
              </div>
            </div>
          </div>
        )}
        {order.shippingAddress && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-900">{sa.firstName} {sa.lastName}</p>
              {sa.company && <p>{sa.company}</p>}
              {streetAddr && <p>{streetAddr}</p>}
              {sa.street2 && <p>{sa.street2}</p>}
              <p>
                {[sa.city, sa.state, sa.postalCode].filter(Boolean).join(', ')}
              </p>
              {sa.country && <p>{sa.country}</p>}
              {sa.phone && <p className="mt-1">📞 {sa.phone}</p>}
              {sa.email && <p>✉️ {sa.email}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Status History */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Order Timeline</h2>
          <div className="space-y-4">
            {order.statusHistory.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
                  {i < order.statusHistory.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-gray-900 capitalize">{entry.status?.replace('-', ' ')}</p>
                  {entry.note && <p className="text-sm text-gray-500 mt-0.5">{entry.note}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Note */}
      {order.customerNote && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Your Note</h2>
          <p className="text-sm text-gray-600">{order.customerNote}</p>
        </div>
      )}
    </div>
  );
}
