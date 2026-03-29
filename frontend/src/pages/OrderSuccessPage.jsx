import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI, productsAPI, settingsAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import { useProductPageSettings } from '@/hooks/useProductPageSettings';
import {
  IoHelpCircleOutline,
  IoCartOutline,
  IoGiftOutline,
  IoCallOutline,
  IoMailOutline,
  IoCheckmarkCircleOutline,
  IoCardOutline,
  IoCubeOutline,
  IoAirplaneOutline,
  IoHomeOutline,
  IoLogoWhatsapp,
  IoLogoFacebook,
  IoLogoTwitter,
} from 'react-icons/io5';
import Loading from '@/components/common/Loading';
import thankYouImg from '@/assets/thank-you.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImgSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string' && img.startsWith('http')) return img;
  return `${API_URL}${img}`;
};

const JOURNEY_STEPS = [
  { key: 'placed',    label: 'Order Placed',       desc: 'Done',                icon: IoCheckmarkCircleOutline },
  { key: 'confirmed', label: 'Payment Confirmed',  desc: 'You are here!',       icon: IoCardOutline },
  { key: 'packing',   label: 'Packing',            desc: 'Within 24 hours',     icon: IoCubeOutline },
  { key: 'shipped',   label: 'Shipped',            desc: '1-2 business days',   icon: IoAirplaneOutline },
  { key: 'delivered', label: 'Delivered',           desc: '3-7 business days',   icon: IoHomeOutline },
];

export default function OrderSuccessPage() {
  const { formatPrice } = useCurrencyStore();
  const { orderId } = useParams();
  const { settings: pageSettings } = useProductPageSettings();

  const { data, isLoading } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOne(orderId),
    { enabled: !!orderId }
  );

  const order = data?.data?.data || data?.data;

  const { data: bankDetailsData } = useQuery('bankDetails', () => settingsAPI.getBankDetails(), { staleTime: 10 * 60 * 1000 });
  const bankDetails = bankDetailsData?.data?.data || [];

  const { data: recData } = useQuery(
    'recommendedProducts',
    () => productsAPI.getFeatured(),
    { staleTime: 5 * 60 * 1000 }
  );
  const recommended = (recData?.data?.data || recData?.data || []).slice(0, 4);

  const paymentMethods = pageSettings?.checkoutDrawer?.paymentMethods?.filter(m => m.enabled !== false) || [];
  const orderPaymentMethod = paymentMethods.find(m => m.id === order?.paymentMethod);
  const paymentMethodLabel = orderPaymentMethod?.label || order?.paymentMethod || 'N/A';

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const firstItem = order?.items?.[0];
  const shareText = firstItem ? `I've just purchased: '${firstItem.name}'` : "I just placed an order at PESA Shop!";

  if (isLoading) return <Loading fullScreen />;

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-500 mb-6">We couldn't find this order.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-[#0F604B] text-white font-bold rounded-lg hover:bg-[#0d5340] transition-colors">Go Home</Link>
        </div>
      </div>
    );
  }

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const estStart = new Date(orderDate); estStart.setDate(estStart.getDate() + 4);
  const estEnd = new Date(orderDate); estEnd.setDate(estEnd.getDate() + 8);
  const estStartStr = estStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const estEndStr = estEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const customer = order.customer || {};
  const shipping = order.shippingAddress || {};
  const pickup = order.pickupAddress || {};
  const isPickup = order.deliveryMethod === 'pickup';

  // Current step index (just placed = index 1, "Payment Confirmed — You are here!")
  const currentStepIdx = 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">

        {/* ═══ SECTION 1: Thank You Header ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 text-center mb-6">
          <img src={thankYouImg} alt="Thank You" className="mx-auto w-36 md:w-44 mb-4" />

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Thank you. Your order has been received!
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Thanks for choosing <strong className="text-gray-900">PESA Shop!</strong> Our team is already preparing your items with care. You'll receive a tracking email within 48 hours so you can follow your package every step of the way.
          </p>

          <div className="inline-block bg-[#E8A838] rounded-xl px-8 py-5 mb-6">
            <p className="text-[#0F604B] font-bold text-lg mb-2">Track Your Order Here</p>
            <Link to="/track-order" className="inline-block px-6 py-2.5 bg-[#0F604B] text-white font-bold text-sm uppercase tracking-wider rounded hover:bg-[#0d5340] transition-colors">
              Order Tracking
            </Link>
          </div>

          <div>
            <p className="font-bold text-gray-900">Your Order # {order.orderNumber || order._id?.slice(-8)}</p>
            <p className="text-gray-500 text-sm">{formattedDate}</p>
          </div>
        </div>

        {/* ═══ SECTION 2: Customer Details ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-center font-bold text-gray-900 mb-1">Customer details</h2>
          <div className="w-16 h-0.5 bg-[#0F604B] mx-auto mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer information</h3>
              <div className="border border-gray-200 rounded-lg p-4 text-sm space-y-1.5">
                <p><span className="font-semibold text-gray-700">Customer:</span> {customer.firstName || shipping.firstName} {customer.lastName || shipping.lastName}</p>
                {(customer.email || shipping.email) && (
                  <p><span className="font-semibold text-gray-700">E-mail:</span> {customer.email || shipping.email}</p>
                )}
                {(customer.phone || shipping.phone) && (
                  <p><span className="font-semibold text-gray-700">Phone:</span> {customer.phone || shipping.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping / Pickup Address */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {isPickup ? 'Collection address' : 'Shipping address'}
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 text-sm space-y-1.5">
                {isPickup ? (
                  <>
                    {(pickup.name || pickup.label) && (
                      <p><span className="font-semibold text-gray-700">Hub:</span> {pickup.name || pickup.label}</p>
                    )}
                    <p className="font-semibold text-gray-700">Address:</p>
                    <p className="text-gray-600">
                      {pickup.address || pickup.street || pickup.line1 || 'Address provided at checkout'}
                      {pickup.city ? `, ${pickup.city}` : ''}
                      {pickup.state || pickup.province ? `, ${pickup.state || pickup.province}` : ''}
                      {pickup.postalCode || pickup.zip ? `, ${pickup.postalCode || pickup.zip}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p><span className="font-semibold text-gray-700">Customer:</span> {shipping.firstName || customer.firstName} {shipping.lastName || customer.lastName}</p>
                    {(shipping.address || shipping.street) && (
                      <>
                        <p className="font-semibold text-gray-700">Address:</p>
                        <p className="text-gray-600">
                          {shipping.address || shipping.street}
                          {shipping.city ? `, ${shipping.city}` : ''}
                          {shipping.state ? `, ${shipping.state}` : ''}
                          {shipping.postalCode ? `, ${shipping.postalCode}` : ''}
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: Order Details ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-center font-bold text-gray-900 mb-1">Order Details</h2>
          <div className="w-16 h-0.5 bg-[#0F604B] mx-auto mb-6" />

          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Product</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</span>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item, idx) => {
              const prod = item.product || {};
              const img = prod.images?.[0] || prod.featuredImage;
              return (
                <div key={idx} className="py-4 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {img ? (
                      <img src={getImgSrc(img)} alt={item.name} className="w-16 h-16 object-contain border border-gray-100 rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">× {item.quantity}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 whitespace-nowrap">{formatPrice(item.total || item.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-[#0F604B] mt-4 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Subtotal:</span>
              <span className="font-bold text-gray-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Shipping:</span>
              <span className="font-medium text-gray-900">{order.shipping > 0 ? formatPrice(order.shipping) : 'Free shipping'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Discount:</span>
                <span className="font-medium text-green-600">-{formatPrice(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Tax:</span>
                <span className="font-medium text-gray-900">{formatPrice(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2">
              <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Total:</span>
              <span className="font-extrabold text-xl text-gray-900">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Payment method:</span>
              <span className="font-medium text-gray-900 text-right">{paymentMethodLabel}</span>
            </div>
          </div>

          <div className="border-t-2 border-[#0F604B] mt-4 pt-4 flex justify-between items-center">
            <span className="uppercase tracking-wider text-gray-500 font-semibold text-xs">Will you collect or should we deliver?:</span>
            <span className="font-bold text-gray-900 capitalize">{isPickup ? 'Collect' : 'Deliver'}</span>
          </div>
        </div>

        {/* ═══ BANK DETAILS ═══ */}
        {bankDetails.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-center font-bold text-gray-900 mb-1">Payment Details</h2>
            <div className="w-16 h-0.5 bg-[#0F604B] mx-auto mb-4" />
            <p className="text-sm text-gray-600 text-center mb-6">If you selected EFT / Bank Transfer, please use the banking details below to complete your payment. Use your order number <strong>#{order.orderNumber || order._id?.slice(-8)}</strong> as the payment reference.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankDetails.map((bank, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <p className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">{bank.bankName}</p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {bank.accountName && <><p className="text-gray-500">Account Name</p><p className="font-semibold text-gray-900">{bank.accountName}</p></>}
                    {bank.accountNumber && <><p className="text-gray-500">Account No.</p><p className="font-semibold text-gray-900">{bank.accountNumber}</p></>}
                    {bank.branchCode && <><p className="text-gray-500">Branch Code</p><p className="font-semibold text-gray-900">{bank.branchCode}</p></>}
                    {bank.accountType && <><p className="text-gray-500">Account Type</p><p className="font-semibold text-gray-900">{bank.accountType}</p></>}
                    {bank.reference && <><p className="text-gray-500">Reference</p><p className="font-semibold text-gray-900">{bank.reference}</p></>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-700">Your order will be processed once payment has been confirmed. Please allow 1-2 business days for EFT verification.</p>
            </div>
          </div>
        )}

        {/* ═══ SECTION 4: Your Order Journey ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* Journey illustration — same height as right panel */}
            <div className="w-full md:w-2/5 flex-shrink-0 flex">
              <div className="bg-gradient-to-br from-[#0F604B] to-[#1a7a5e] rounded-xl p-8 text-white text-center flex flex-col items-center justify-center w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <p className="font-bold text-lg">Your package is on its way!</p>
                <p className="text-sm text-green-200 mt-1">Est. {estStartStr} - {estEndStr}</p>
              </div>
            </div>

            {/* Journey steps — vertical timeline like OrderTracking */}
            <div className="flex-1">
              <h3 className="text-xl font-extrabold text-gray-900 uppercase mb-2">Your Order Journey</h3>
              <p className="text-sm text-gray-600 mb-5">
                If you selected an <strong>offline payment method</strong>, we will be in touch with you shortly to finalize your order. Otherwise, you're all done! Here are the next steps.
              </p>

              <div className="relative">
                {JOURNEY_STEPS.map((step, i) => {
                  const isActive = i <= currentStepIdx;
                  const isCurrent = i === currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative" style={{ paddingBottom: i < JOURNEY_STEPS.length - 1 ? '20px' : 0 }}>
                      {/* Vertical connector line */}
                      {i < JOURNEY_STEPS.length - 1 && (
                        <div
                          className="absolute left-[15px] top-[32px] w-[2px]"
                          style={{
                            height: 'calc(100% - 16px)',
                            backgroundColor: i < currentStepIdx ? '#10b981' : '#e5e7eb',
                          }}
                        />
                      )}
                      {/* Circle with icon */}
                      <div
                        className={`relative z-10 w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isActive
                            ? 'bg-[#10b981] text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                      >
                        <Icon size={16} />
                      </div>
                      {/* Label + desc horizontal */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                          <span className={`text-xs ${isCurrent ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>— {step.desc}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5: Contact Cards ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { Icon: IoHelpCircleOutline, title: 'General Queries', email: 'hello@pesashop.com' },
            { Icon: IoCartOutline,        title: 'Orders & Payments', email: 'admin@pesashop.com' },
            { Icon: IoGiftOutline,        title: 'Delivery Queries', email: 'shipping@pesashop.com' },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <div className="w-14 h-14 bg-[#0F604B] rounded-full flex items-center justify-center mx-auto mb-3">
                <card.Icon className="text-white" size={26} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F604B] mb-3">{card.title}</h4>
              <div className="space-y-1.5 text-sm text-gray-600">
                <p className="flex items-center justify-center gap-1.5">
                  <IoCallOutline className="text-gray-500" size={14} />
                  +27 73 563 7564
                </p>
                <p className="flex items-center justify-center gap-1.5">
                  <IoLogoWhatsapp className="text-green-600" size={14} />
                  +27 73 563 7564
                </p>
                <p className="flex items-center justify-center gap-1.5">
                  <IoMailOutline className="text-gray-500" size={14} />
                  {card.email}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 6: Continue Shopping / My Account CTAs ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#E8A838] rounded-xl p-6 text-center">
            <h3 className="text-2xl font-extrabold text-[#0F604B] mb-3">Continue Shopping</h3>
            <Link to="/" className="inline-block px-6 py-2.5 bg-[#0F604B] text-white font-bold text-sm uppercase tracking-wider rounded hover:bg-[#0d5340] transition-colors">
              Go Shopping
            </Link>
          </div>
          <div className="bg-[#E8A838] rounded-xl p-6 text-center">
            <h3 className="text-2xl font-extrabold text-[#0F604B] mb-3">My Account</h3>
            <Link to="/account" className="inline-block px-6 py-2.5 bg-[#0F604B] text-white font-bold text-sm uppercase tracking-wider rounded hover:bg-[#0d5340] transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* ═══ SECTION 7: Items You Would Also Like ═══ */}
        {recommended.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-6">Items You Would Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((prod) => {
                const img = prod.images?.[0] || prod.featuredImage;
                const price = prod.salePrice || prod.regularPrice || 0;
                return (
                  <div key={prod._id} className="text-center group">
                    <Link to={`/product/${prod.slug}`}>
                      <div className="aspect-square bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                        {img ? (
                          <img src={getImgSrc(img)} alt={prod.name} className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-gray-300 text-xs">No image</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{prod.name}</p>
                    </Link>
                    <p className="font-bold text-sm text-gray-900 mb-2">{formatPrice(price)}</p>
                    <Link to={`/product/${prod.slug}`} className="inline-block w-full px-3 py-2 bg-[#0F604B] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#0d5340] transition-colors">
                      Add to Cart
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ SECTION 8: Tell Your Friends — Social Sharing ═══ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-5">Tell Your Friends!</h2>

          <div className="flex items-center justify-center gap-6 mb-5">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#1877F2] hover:opacity-80 transition-opacity font-medium text-sm"
            >
              <IoLogoFacebook size={20} />
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#1DA1F2] hover:opacity-80 transition-opacity font-medium text-sm"
            >
              <IoLogoTwitter size={20} />
              Twitter
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#25D366] hover:opacity-80 transition-opacity font-medium text-sm"
            >
              <IoLogoWhatsapp size={20} />
              WhatsApp
            </a>
          </div>

          <div className="border-t border-gray-200 pt-5">
            {firstItem && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-bold text-gray-900">{shareText}</p>
                </div>
                <div className="flex items-start gap-4 p-4">
                  {(firstItem.product?.images?.[0] || firstItem.product?.featuredImage) && (
                    <img src={getImgSrc(firstItem.product?.images?.[0] || firstItem.product?.featuredImage)} alt={firstItem.name} className="w-24 h-24 object-contain flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {firstItem.product?.shortDescription || firstItem.product?.description?.replace(/<[^>]*>/g, '').slice(0, 200) || firstItem.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
