import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI, productsAPI, settingsAPI } from '@/services/api';
import { useKioskConfig } from '@/hooks/useKioskConfig';
import { useCartStore, useCurrencyStore } from '@/store';
import { useProductPageSettings } from '@/hooks/useProductPageSettings';
import KioskHeader from '@/components/kiosk/KioskHeader';
import KioskConfetti from '@/components/kiosk/KioskConfetti';
import { resolveUrl } from '@/utils/kioskUrl';
import {
  IoCheckmarkCircle, IoHomeOutline, IoCardOutline, IoCubeOutline,
  IoAirplaneOutline, IoStorefrontOutline, IoCallOutline, IoMailOutline,
  IoLogoWhatsapp, IoHelpCircleOutline, IoCartOutline, IoGiftOutline,
  IoLocateOutline,
} from 'react-icons/io5';

const JOURNEY_STEPS = [
  { key: 'placed',    label: 'Order Placed',      desc: 'Done',              icon: IoCheckmarkCircle },
  { key: 'confirmed', label: 'Payment Confirmed', desc: 'You are here!',     icon: IoCardOutline },
  { key: 'packing',   label: 'Packing',           desc: 'Within 24 hours',   icon: IoCubeOutline },
  { key: 'shipped',   label: 'Shipped',           desc: '1-2 business days', icon: IoAirplaneOutline },
  { key: 'delivered', label: 'Delivered',         desc: '3-7 business days', icon: IoHomeOutline },
];

export default function KioskOrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { config } = useKioskConfig();
  const { formatPrice } = useCurrencyStore();
  const { settings: pageSettings } = useProductPageSettings();
  const removeItem = useCartStore(s => s.removeItem);

  // Clear cart on first mount (the order is placed; this kiosk session is done shopping)
  useEffect(() => {
    const items = useCartStore.getState().items;
    for (let i = items.length - 1; i >= 0; i--) removeItem(i);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useQuery(['kiosk-order', orderId], () => ordersAPI.getOne(orderId), {
    enabled: !!orderId, refetchOnWindowFocus: false,
  });
  const order = data?.data?.data || data?.data;

  const { data: bankRes } = useQuery('kiosk-bank-details', () => settingsAPI.getBankDetails(), { staleTime: 10 * 60 * 1000 });
  const bankDetails = bankRes?.data?.data || [];

  const { data: recRes } = useQuery('kiosk-recommended-success', () => productsAPI.getFeatured(), { staleTime: 5 * 60 * 1000 });
  const recommended = (recRes?.data?.data || recRes?.data || []).slice(0, 4);

  // Auto-return countdown
  const seconds = config?.successAutoReturnSeconds || 60;
  const [countdown, setCountdown] = useState(seconds);
  useEffect(() => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          navigate('/kiosk', { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, navigate]);

  if (isLoading) return <Shell><div className="p-12 text-gray-500 text-center">Loading order…</div></Shell>;
  if (!order) {
    return (
      <Shell>
        <div className="p-12 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Order not found</div>
          <button onClick={() => navigate('/kiosk', { replace: true })} className="px-6 py-3 bg-primary text-white rounded-xl text-lg font-semibold">Back to Home</button>
        </div>
      </Shell>
    );
  }

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  const estStart = new Date(orderDate); estStart.setDate(estStart.getDate() + 4);
  const estEnd = new Date(orderDate); estEnd.setDate(estEnd.getDate() + 8);
  const estStartStr = estStart.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  const estEndStr = estEnd.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });

  const customer = order.customer || {};
  const shipping = order.shippingAddress || {};
  const pickup = order.pickupAddress || {};
  const isPickup = order.deliveryMethod === 'pickup';
  const currentStepIdx = 1;

  const paymentMethods = pageSettings?.checkoutDrawer?.paymentMethods?.filter(m => m.enabled !== false) || [];
  const orderPaymentMethod = paymentMethods.find(m => m.id === order?.paymentMethod);
  const paymentMethodLabel = orderPaymentMethod?.label || order?.paymentMethod || 'N/A';

  return (
    <Shell>
      <KioskConfetti />
      <main className="kiosk-account-scope max-w-[1600px] mx-auto w-full px-6 md:px-10 py-6 md:py-8 space-y-6 pb-12">
        {/* ── 1. Thank-you header ─────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white rounded-3xl shadow-xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/15 flex items-center justify-center animate-[ping_1.5s_ease-out_1] mb-4">
            <IoCheckmarkCircle size={88} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Thank You!</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Your order has been received. Our team is already preparing your items with care. You'll receive a tracking
            email within 48 hours so you can follow your package every step of the way.
          </p>
          <div className="mt-6 inline-flex flex-col items-center bg-white/15 backdrop-blur rounded-2xl px-8 py-4">
            <div className="text-xs uppercase tracking-widest opacity-80">Order Number</div>
            <div className="text-3xl md:text-4xl font-extrabold mt-1">{order.orderNumber || `#${order._id?.slice(-8).toUpperCase()}`}</div>
            <div className="text-sm opacity-80 mt-1">{formattedDate}</div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate(`/kiosk/track`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-black font-bold rounded-xl shadow"
            >
              <IoLocateOutline size={22} /> Track this Order
            </button>
          </div>
        </div>

        {/* ── 2. Customer details + shipping/pickup address ───────────── */}
        <Section title="Customer Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Customer Information">
              <Line label="Customer" value={`${customer.firstName || shipping.firstName || ''} ${customer.lastName || shipping.lastName || ''}`.trim()} />
              <Line label="Email" value={customer.email || shipping.email} />
              <Line label="Phone" value={customer.phone || shipping.phone} />
            </Card>
            <Card title={isPickup ? 'Collection Address' : 'Shipping Address'}>
              {isPickup ? (
                <>
                  <Line label="Hub" value={pickup.name || pickup.label} />
                  <p className="text-base text-gray-700">
                    {pickup.address || pickup.street || pickup.line1 || 'Address provided at checkout'}
                    {pickup.city ? `, ${pickup.city}` : ''}
                    {pickup.state || pickup.province ? `, ${pickup.state || pickup.province}` : ''}
                    {pickup.postalCode || pickup.zip ? `, ${pickup.postalCode || pickup.zip}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <Line label="Recipient" value={`${shipping.firstName || customer.firstName || ''} ${shipping.lastName || customer.lastName || ''}`.trim()} />
                  <p className="text-base text-gray-700">
                    {shipping.address || shipping.street}
                    {shipping.city ? `, ${shipping.city}` : ''}
                    {shipping.state ? `, ${shipping.state}` : ''}
                    {shipping.postalCode ? `, ${shipping.postalCode}` : ''}
                  </p>
                </>
              )}
            </Card>
          </div>
        </Section>

        {/* ── 3. Order details ────────────────────────────────────────── */}
        <Section title="Order Details">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="hidden md:flex items-center justify-between border-b border-gray-200 px-5 py-3 bg-gray-50">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Product</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</span>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => {
                const prod = item.product || {};
                const img = prod.images?.[0] || prod.featuredImage || item.image;
                return (
                  <div key={idx} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                      {img ? <img src={resolveUrl(img)} alt={item.name} className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-gray-400">No img</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base md:text-lg font-semibold text-gray-900 truncate">{item.name}</div>
                      <div className="text-sm text-gray-500">× {item.quantity}</div>
                    </div>
                    <div className="text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">
                      {formatPrice(item.total || item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t-2 border-primary space-y-2">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={order.shipping > 0 ? formatPrice(order.shipping) : 'Free shipping'} />
              {order.discount > 0 && <Row label="Discount" value={`-${formatPrice(order.discount)}`} accent />}
              {order.tax > 0 && <Row label="Tax" value={formatPrice(order.tax)} />}
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900 uppercase tracking-wider">Total</span>
                <span className="text-2xl md:text-3xl font-extrabold text-primary">{formatPrice(order.total)}</span>
              </div>
              <Row label="Payment Method" value={paymentMethodLabel} />
              <Row label={isPickup ? 'Fulfilment' : 'Delivery'} value={isPickup ? 'Customer collection' : 'Home delivery'} />
            </div>
          </div>
        </Section>

        {/* ── 4. Bank details (EFT) ───────────────────────────────────── */}
        {bankDetails.length > 0 && (
          <Section title="Payment Details">
            <p className="text-base text-gray-600 mb-4">
              If you selected EFT / Bank Transfer, please use the banking details below to complete your payment.
              Use your order number <strong>{order.orderNumber || order._id?.slice(-8)}</strong> as the payment reference.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankDetails.map((bank, idx) => (
                <Card key={idx} title={bank.bankName}>
                  {bank.accountName && <Line label="Account Name" value={bank.accountName} />}
                  {bank.accountNumber && <Line label="Account No." value={bank.accountNumber} />}
                  {bank.branchCode && <Line label="Branch Code" value={bank.branchCode} />}
                  {bank.accountType && <Line label="Account Type" value={bank.accountType} />}
                  {bank.reference && <Line label="Reference" value={bank.reference} />}
                </Card>
              ))}
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              Your order will be processed once payment is confirmed. Please allow 1–2 business days for EFT verification.
            </div>
          </Section>
        )}

        {/* ── 5. Your order journey ───────────────────────────────────── */}
        <Section title="Your Order Journey">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6">
            <div className="bg-gradient-to-br from-primary to-primary-700 text-white rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <IoAirplaneOutline size={56} className="opacity-90" />
              <p className="text-xl font-bold mt-3">Your package is on its way!</p>
              <p className="text-sm opacity-80 mt-1">Est. {estStartStr} – {estEndStr}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
              <div className="space-y-4">
                {JOURNEY_STEPS.map((step, i) => {
                  const isActive = i <= currentStepIdx;
                  const isCurrent = i === currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'} ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-base md:text-lg font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</div>
                        <div className={`text-sm ${isCurrent ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 6. Contact cards ────────────────────────────────────────── */}
        <Section title="Need Help?">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { Icon: IoHelpCircleOutline, title: 'General Queries', email: 'hello@pesashop.com' },
              { Icon: IoCartOutline, title: 'Orders & Payments', email: 'admin@pesashop.com' },
              { Icon: IoStorefrontOutline, title: 'Delivery Queries', email: 'shipping@pesashop.com' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 text-center">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <c.Icon className="text-white" size={26} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{c.title}</h4>
                <div className="space-y-1.5 text-sm text-gray-700">
                  <p className="flex items-center justify-center gap-1.5"><IoCallOutline className="text-gray-500" size={14} /> +27 73 563 7564</p>
                  <p className="flex items-center justify-center gap-1.5"><IoLogoWhatsapp className="text-green-600" size={14} /> +27 73 563 7564</p>
                  <p className="flex items-center justify-center gap-1.5"><IoMailOutline className="text-gray-500" size={14} /> {c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 7. You may also like ────────────────────────────────────── */}
        {recommended.length > 0 && (
          <Section title="Items You Would Also Like">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map(prod => {
                const img = prod.images?.[0] || prod.featuredImage;
                const price = prod.salePrice || prod.regularPrice || 0;
                return (
                  <button
                    key={prod._id}
                    onClick={() => navigate(`/kiosk/product/${prod.slug || prod._id}`)}
                    className="kiosk-tile bg-white rounded-2xl shadow-sm overflow-hidden text-left flex flex-col"
                  >
                    <div className="h-44 bg-white flex items-center justify-center p-3">
                      {img && <img src={resolveUrl(img)} alt={prod.name} className="max-w-full max-h-full object-contain" />}
                    </div>
                    <div className="p-3">
                      <div className="text-base font-semibold text-gray-800 line-clamp-2 leading-tight">{prod.name}</div>
                      <div className="mt-1 text-primary font-bold">{formatPrice(price)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Auto-return CTA ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-gray-900">Done?</div>
            <div className="text-sm text-gray-500">Returning to home in <strong>{countdown}s</strong>…</div>
          </div>
          <button
            onClick={() => navigate('/kiosk', { replace: true })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl text-lg font-bold shadow-lg"
          >
            <IoHomeOutline size={24} /> Back to Home now
          </button>
        </div>
      </main>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <KioskHeader />
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Line({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3 text-base">
      <span className="text-gray-500 font-medium">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-baseline text-base">
      <span className="text-gray-600 uppercase tracking-wider text-xs font-semibold">{label}</span>
      <span className={`font-medium ${accent ? 'text-green-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
