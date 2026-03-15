import React, { useState } from 'react';
import { ordersAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  confirmed:   { label: 'Confirmed',   color: '#3b82f6', bg: '#dbeafe', icon: '✓' },
  processing:  { label: 'Processing',  color: '#8b5cf6', bg: '#ede9fe', icon: '⚙' },
  shipped:     { label: 'Shipped',     color: '#6366f1', bg: '#e0e7ff', icon: '🚚' },
  delivered:   { label: 'Delivered',   color: '#10b981', bg: '#d1fae5', icon: '📦' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#d1fae5', icon: '✅' },
  cancelled:   { label: 'Cancelled',   color: '#ef4444', bg: '#fee2e2', icon: '✕' },
  refunded:    { label: 'Refunded',    color: '#6b7280', bg: '#f3f4f6', icon: '↩' },
};

const PAYMENT_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7' },
  paid:      { label: 'Paid',      color: '#10b981', bg: '#d1fae5' },
  failed:    { label: 'Failed',    color: '#ef4444', bg: '#fee2e2' },
  refunded:  { label: 'Refunded',  color: '#6b7280', bg: '#f3f4f6' },
  partial:   { label: 'Partial',   color: '#f59e0b', bg: '#fef3c7' },
};

const TIMELINE_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function resolveImageUrl(path) {
  if (!path) return '';
  if (typeof path === 'object' && path.url) return resolveImageUrl(path.url);
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}


function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function OrderResult({ order }) {
  const { formatPrice } = useCurrencyStore();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const payment = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.pending;
  const currentStepIndex = TIMELINE_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>Order #{order.orderNumber}</h4>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: status.color, backgroundColor: status.bg }}>{status.icon} {status.label}</span>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: payment.color, backgroundColor: payment.bg }}>Payment: {payment.label}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div style={{ marginBottom: '28px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Order Progress</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
            {TIMELINE_ORDER.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const stepCfg = STATUS_CONFIG[step];
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i > 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '50%', width: '100%', height: '3px', backgroundColor: isActive ? '#10b981' : '#e5e7eb', zIndex: 0 }} />
                  )}
                  <div style={{
                    width: isCurrent ? '28px' : '24px', height: isCurrent ? '28px' : '24px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isActive ? '#10b981' : '#e5e7eb', color: isActive ? '#fff' : '#9ca3af',
                    fontSize: '12px', fontWeight: 700, zIndex: 1, position: 'relative',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(16,185,129,0.2)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {isActive ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 500, color: isActive ? '#059669' : '#9ca3af', marginTop: '6px', textAlign: 'center' }}>{stepCfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {(order.trackingNumber || order.trackingUrl) && (
        <div style={{ padding: '14px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '20px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af', margin: '0 0 6px' }}>Shipping Tracking</h5>
          {order.trackingNumber && <p style={{ fontSize: '13px', color: '#1e40af', margin: '0 0 4px' }}>Tracking #: <strong>{order.trackingNumber}</strong></p>}
          {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'underline' }}>Track shipment →</a>}
          {order.shippedAt && <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>Shipped: {formatDate(order.shippedAt)}</p>}
          {order.deliveredAt && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Delivered: {formatDate(order.deliveredAt)}</p>}
        </div>
      )}

      {/* Items */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Items Ordered</h5>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          {order.items?.map((item, i) => {
            const img = resolveImageUrl(item.product?.featuredImage || item.product?.images?.[0]);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderBottom: i < order.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                {img && <img src={img} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  {item.sku && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>SKU: {item.sku}</p>}
                  {item.variation && <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>{typeof item.variation === 'string' ? item.variation : Object.entries(item.variation).map(([k,v]) => `${k}: ${v}`).join(', ')}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{formatPrice(item.total)}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Addresses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {order.billingAddress && (
          <div style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Billing Address</h5>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
              {order.billingAddress.firstName} {order.billingAddress.lastName}<br />
              {order.billingAddress.street}<br />
              {order.billingAddress.street2 && <>{order.billingAddress.street2}<br /></>}
              {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}<br />
              {order.billingAddress.country}
              {order.billingAddress.phone && <><br />{order.billingAddress.phone}</>}
            </p>
          </div>
        )}
        {order.shippingAddress && (
          <div style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Shipping Address</h5>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, margin: 0 }}>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.street2 && <>{order.shippingAddress.street2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
            </p>
          </div>
        )}
      </div>

      {/* Totals */}
      <div style={{ padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Subtotal</span>
          <span style={{ fontSize: '13px', color: '#374151' }}>{formatPrice(order.subtotal)}</span>
        </div>
        {order.tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Tax</span>
            <span style={{ fontSize: '13px', color: '#374151' }}>{formatPrice(order.tax)}</span>
          </div>
        )}
        {order.shipping > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ''}</span>
            <span style={{ fontSize: '13px', color: '#374151' }}>{formatPrice(order.shipping)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#059669' }}>Discount</span>
            <span style={{ fontSize: '13px', color: '#059669' }}>-{formatPrice(order.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb', marginTop: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Total</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Status History */}
      {order.statusHistory?.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Status History</h5>
          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '16px' }}>
            {order.statusHistory.slice().reverse().map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status] || { label: entry.status, color: '#6b7280', bg: '#f3f4f6' };
              return (
                <div key={i} style={{ marginBottom: '12px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cfg.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>{formatDate(entry.timestamp)}</span>
                  {entry.note && <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{entry.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Payment Method</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>{order.paymentMethodTitle || order.paymentMethod}</span>
      </div>
    </div>
  );
}

export const OrderTracking = ({
  title = 'Track Your Order',
  description = 'Enter your order ID and billing email to track your order status.',
  buttonText = 'Track Order',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both your order number and email address.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await ordersAPI.track(orderNumber.trim(), email.trim());
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find your order. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setError('');
    setOrderNumber('');
    setEmail('');
  };

  return (
    <div className={className} style={{ maxWidth: order ? '700px' : '500px', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', margin: '0 auto', transition: 'max-width 0.3s', ...style }}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.5 }}>{description}</p>

      <form onSubmit={handleTrack}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Order Number</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-1234567890-00001"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Billing Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email you used during checkout"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, padding: '12px', backgroundColor: loading ? '#9ca3af' : buttonColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
          >
            {loading ? 'Searching...' : buttonText}
          </button>
          {order && (
            <button
              type="button"
              onClick={handleReset}
              style={{ padding: '12px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
            >
              New Search
            </button>
          )}
        </div>
      </form>

      {order && <OrderResult order={order} />}
    </div>
  );
};

OrderTracking.craft = { displayName: 'Order Tracking' };
