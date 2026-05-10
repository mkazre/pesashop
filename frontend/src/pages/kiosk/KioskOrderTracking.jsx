import React, { useState } from 'react';
import { ordersAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import KioskHeader from '@/components/kiosk/KioskHeader';
import VirtualKeyboard from '@/components/kiosk/VirtualKeyboard';
import {
  IoLocateOutline, IoSearchOutline, IoCheckmarkCircle, IoCloseCircle,
  IoTimeOutline, IoCubeOutline, IoCarOutline, IoMailOutline, IoReceiptOutline,
  IoRefreshOutline, IoArrowBackOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveImageUrl = (path) => {
  if (!path) return '';
  if (typeof path === 'object' && path.url) return resolveImageUrl(path.url);
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
};

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#f59e0b', bg: '#fef3c7' },
  confirmed:  { label: 'Confirmed',  color: '#3b82f6', bg: '#dbeafe' },
  processing: { label: 'Processing', color: '#8b5cf6', bg: '#ede9fe' },
  shipped:    { label: 'Shipped',    color: '#6366f1', bg: '#e0e7ff' },
  delivered:  { label: 'Delivered',  color: '#10b981', bg: '#d1fae5' },
  completed:  { label: 'Completed',  color: '#059669', bg: '#d1fae5' },
  cancelled:  { label: 'Cancelled',  color: '#ef4444', bg: '#fee2e2' },
  refunded:   { label: 'Refunded',   color: '#6b7280', bg: '#f3f4f6' },
};

const PAYMENT_CONFIG = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fef3c7' },
  paid:     { label: 'Paid',     color: '#10b981', bg: '#d1fae5' },
  failed:   { label: 'Failed',   color: '#ef4444', bg: '#fee2e2' },
  refunded: { label: 'Refunded', color: '#6b7280', bg: '#f3f4f6' },
  partial:  { label: 'Partial',  color: '#f59e0b', bg: '#fef3c7' },
};

const TIMELINE = [
  { id: 'pending',    label: 'Pending',    icon: IoTimeOutline },
  { id: 'confirmed',  label: 'Confirmed',  icon: IoCheckmarkCircle },
  { id: 'processing', label: 'Processing', icon: IoCubeOutline },
  { id: 'shipped',    label: 'Shipped',    icon: IoCarOutline },
  { id: 'delivered',  label: 'Delivered',  icon: IoReceiptOutline },
  { id: 'completed',  label: 'Completed',  icon: IoCheckmarkCircle },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function KioskOrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [activeField, setActiveField] = useState('orderNumber');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both your order number and email address.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await ordersAPI.track(orderNumber.trim(), email.trim());
      setOrder(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't find that order. Double-check the number and email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setError('');
    setOrderNumber('');
    setEmail('');
    setActiveField('orderNumber');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <KioskHeader />

      <main className="flex-1 px-6 py-6 md:px-10 md:py-8 max-w-[1800px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IoLocateOutline size={24} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Track Your Order</h1>
            <p className="text-gray-500">Enter the order number from your confirmation and the billing email used at checkout.</p>
          </div>
          {order && (
            <button onClick={reset} className="ml-auto kiosk-tile inline-flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-xl text-gray-700 font-medium">
              <IoRefreshOutline size={20} /> New search
            </button>
          )}
        </div>

        {!order ? (
          <SearchForm
            orderNumber={orderNumber}
            email={email}
            activeField={activeField}
            setActiveField={setActiveField}
            setOrderNumber={setOrderNumber}
            setEmail={setEmail}
            submit={submit}
            loading={loading}
            error={error}
          />
        ) : (
          <OrderResult order={order} />
        )}
      </main>
    </div>
  );
}

function SearchForm({ orderNumber, email, activeField, setActiveField, setOrderNumber, setEmail, submit, loading, error }) {
  const value = activeField === 'orderNumber' ? orderNumber : email;
  const setValue = activeField === 'orderNumber' ? setOrderNumber : setEmail;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)] gap-6 items-start">
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setActiveField('orderNumber')}
            className={`w-full text-left p-4 rounded-xl border-2 transition ${activeField === 'orderNumber' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <IoReceiptOutline size={24} className="text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500">Order Number</div>
                <div className="text-lg font-medium text-gray-900 truncate">
                  {orderNumber || <span className="text-gray-300">e.g. ORD-1234567890-00001</span>}
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveField('email')}
            className={`w-full text-left p-4 rounded-xl border-2 transition ${activeField === 'email' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <IoMailOutline size={24} className="text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500">Billing Email</div>
                <div className="text-lg font-medium text-gray-900 truncate">
                  {email || <span className="text-gray-300">Email used at checkout</span>}
                </div>
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <IoCloseCircle className="text-red-500 mt-0.5 flex-shrink-0" size={22} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="kiosk-tile kiosk-cta-pulse mt-5 w-full inline-flex items-center justify-center gap-3 py-5 bg-primary text-white rounded-2xl text-xl font-bold shadow-lg disabled:bg-gray-300 disabled:animate-none"
        >
          <IoSearchOutline size={26} />
          {loading ? 'Searching…' : 'Track Order'}
        </button>
      </div>

      <div className="lg:sticky lg:top-24 self-start">
        <div className="mb-2 text-sm text-gray-500 px-2">
          Editing: <span className="font-semibold text-gray-800">{activeField === 'orderNumber' ? 'Order Number' : 'Billing Email'}</span>
        </div>
        <VirtualKeyboard value={value} onChange={setValue} />
      </div>
    </div>
  );
}

function OrderResult({ order }) {
  const { formatPrice } = useCurrencyStore();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const payment = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.pending;
  const currentStepIdx = TIMELINE.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="space-y-6">
      {/* Order header card */}
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="text-sm uppercase tracking-widest text-gray-500">Order</div>
            <div className="text-3xl md:text-4xl font-bold text-gray-900">#{order.orderNumber}</div>
            <div className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge label={status.label} color={status.color} bg={status.bg} />
            <Badge label={`Payment: ${payment.label}`} color={payment.color} bg={payment.bg} />
          </div>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-4">Order Progress</h2>
            <div className="flex items-start gap-2">
              {TIMELINE.map((step, i) => {
                const isActive = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isActive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'} ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                      >
                        <Icon size={22} />
                      </div>
                      <span className={`mt-2 text-xs md:text-sm font-medium text-center ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mt-6 ${i < currentStepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Tracking info */}
        {(order.trackingNumber || order.trackingUrl) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="text-sm font-semibold text-blue-900 mb-1">Shipping Tracking</div>
            {order.trackingNumber && (
              <div className="text-sm text-blue-900">Tracking #: <span className="font-bold">{order.trackingNumber}</span></div>
            )}
            {order.shippedAt && <div className="text-xs text-blue-800 mt-1">Shipped: {formatDate(order.shippedAt)}</div>}
            {order.deliveredAt && <div className="text-xs text-blue-800 mt-1">Delivered: {formatDate(order.deliveredAt)}</div>}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Items Ordered</h2>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item, i) => {
            const img = resolveImageUrl(item.product?.featuredImage || item.product?.images?.[0] || item.image);
            return (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {img && <img src={img} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-800 truncate">{item.name}</div>
                  {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                  {item.variation && (
                    <div className="text-xs text-gray-500">
                      {typeof item.variation === 'string' ? item.variation : Object.entries(item.variation).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-gray-900">{formatPrice(item.total)}</div>
                  <div className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.price)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Addresses + totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {order.billingAddress && (
          <AddressCard label="Billing Address" address={order.billingAddress} />
        )}
        {order.shippingAddress && (
          <AddressCard label="Shipping Address" address={order.shippingAddress} />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
        <Row label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.tax > 0 && <Row label="Tax" value={formatPrice(order.tax)} />}
        {order.shipping > 0 && <Row label={`Shipping${order.shippingMethod ? ` (${order.shippingMethod})` : ''}`} value={formatPrice(order.shipping)} />}
        {order.discount > 0 && <Row label="Discount" value={`-${formatPrice(order.discount)}`} accent />}
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(order.total)}</span>
        </div>
        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>Payment Method</span>
          <span className="font-medium text-gray-700 capitalize">{order.paymentMethodTitle || order.paymentMethod}</span>
        </div>
      </div>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Status History</h2>
          <ol className="border-l-2 border-gray-200 ml-2 space-y-4">
            {order.statusHistory.slice().reverse().map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status] || { label: entry.status, color: '#6b7280' };
              return (
                <li key={i} className="ml-4 relative">
                  <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <div className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                  <div className="text-xs text-gray-500">{formatDate(entry.timestamp)}</div>
                  {entry.note && <div className="text-sm text-gray-700 mt-1">{entry.note}</div>}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold" style={{ color, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function AddressCard({ label, address }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <p className="text-sm text-gray-800 leading-relaxed">
        {address.firstName} {address.lastName}<br />
        {address.street}<br />
        {address.street2 && <>{address.street2}<br /></>}
        {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}<br />
        {address.country}
        {address.phone && <><br />{address.phone}</>}
      </p>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${accent ? 'text-green-700' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
