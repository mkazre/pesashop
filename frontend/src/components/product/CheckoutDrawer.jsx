import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { ordersAPI, couponsAPI, laybyPlansAPI, loyaltyAPI, giftCardsAPI, laybyAPI, offersAPI, recurringOrdersAPI } from '@/services/api';
import { useAuthStore, useCartStore, useCurrencyStore, useUIStore } from '@/store';
import toast from '@/utils/toast';
import LaybyWidget from './LaybyWidget';
import OfferCard from '@/components/offers/OfferCard';
import SmartIcon from '@/components/common/SmartIcon';
import useAnalytics from '@/hooks/useAnalytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_PAYMENT_METHODS = [
  { id: 'eft', label: 'EFT / Bank Transfer', displayType: 'icon', icon: '🏦', image: '', enabled: true },
  { id: 'ecocash', label: 'EcoCash', displayType: 'icon', icon: '📱', image: '', enabled: true },
  { id: 'cash', label: 'Cash', displayType: 'icon', icon: '💵', image: '', enabled: true },
  { id: 'card', label: 'Card', displayType: 'icon', icon: '💳', image: '', enabled: true },
];

export default function CheckoutDrawer({ open, onClose, product, quantity: initialQty, selectedVariant, laybyeSelection, settings, onOrderPlaced }) {
  const cd = settings?.checkoutDrawer || {};
  const theme = settings?.theme || {};
  const { user, isAuthenticated } = useAuthStore();
  const cart = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const { openAuthModal } = useUIStore();
  const navigate = useNavigate();
  const { trackPurchase } = useAnalytics();

  const [fulfilment, setFulfilment] = useState('delivery');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Checkout offers
  const { data: checkoutOffersData } = useQuery(
    ['offers-slot', 'checkout'],
    () => offersAPI.getForPage('checkout'),
    { staleTime: 5 * 60 * 1000, enabled: open }
  );
  const checkoutOffers = checkoutOffersData?.data?.data || [];
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('cart'); // cart | details | confirmation
  const [paymentMethods, setPaymentMethods] = useState({ cash: 'eft', laybye: 'eft' });
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({});
  const [selectedPickupAddress, setSelectedPickupAddress] = useState(null);
  
  // ── Laybye eligibility flow ──
  const [pendingLaybyeItem, setPendingLaybyeItem] = useState(null); // { idx, plan, price }
  const [showLaybyeWidget, setShowLaybyeWidget] = useState(false);
  const [laybyeEligibility, setLaybyeEligibility] = useState(null);

  // ── Pesa Coins (Loyalty Points) ──
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);

  // ── Gift Card ──
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [giftCardApplied, setGiftCardApplied] = useState(false);
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  // Dynamic payment methods from settings (with fallback)
  const PAYMENT_METHODS = useMemo(() => {
    const configured = cd.paymentMethods;
    if (configured && Array.isArray(configured) && configured.length > 0) {
      return configured.filter(m => m.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return DEFAULT_PAYMENT_METHODS;
  }, [cd.paymentMethods]);

  // Available pickup addresses from settings
  const pickupAddresses = useMemo(() => {
    const addrs = cd.pickupAddresses;
    if (addrs && Array.isArray(addrs) && addrs.length > 0) {
      return addrs.filter(a => a.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    // Legacy fallback: single pickupAddress string
    if (cd.pickupAddress) return [{ label: 'Pickup', address: cd.pickupAddress }];
    return [];
  }, [cd.pickupAddresses, cd.pickupAddress]);

  // Fetch available laybye plans for the mini plan selector
  const { data: plansData } = useQuery('laybyPlansActive', () => laybyPlansAPI.getActive(), {
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  // Fetch active recurring plans for checkout recurring toggle
  const { data: recurringPlansData } = useQuery('recurringPlansActive-checkout', () => recurringOrdersAPI.getActivePlans(), {
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });
  const allRecurringPlans = useMemo(() => {
    const raw = recurringPlansData?.data?.data || [];
    return Array.isArray(raw) ? raw.filter(p => p.isActive !== false) : [];
  }, [recurringPlansData]);
  const allPlans = useMemo(() => {
    const raw = plansData?.data?.data || plansData?.data || [];
    return Array.isArray(raw) ? raw.filter(p => p.isActive) : [];
  }, [plansData]);

  // Ensure current product is in the cart when drawer opens
  useEffect(() => {
    if (open && product) {
      const existing = cart.items.findIndex(i => i.product._id === product._id);
      if (existing === -1) {
        cart.addItem(product, initialQty || 1, selectedVariant || null);
      }
      // If the product page had a laybye selected, apply it to this item
      if (laybyeSelection && existing >= 0 && !cart.items[existing]?.laybye) {
        cart.setItemLaybye(existing, laybyeSelection);
      } else if (laybyeSelection && existing === -1) {
        // Item was just added, it's the last one
        setTimeout(() => {
          const idx = useCartStore.getState().items.findIndex(i => i.product._id === product._id);
          if (idx >= 0) useCartStore.getState().setItemLaybye(idx, laybyeSelection);
        }, 50);
      }
    }
  }, [open, product?._id]);

  // Initialize form from user data
  useEffect(() => {
    if (open) {
      const initial = {};
      (cd.fields || []).forEach(f => {
        if (f.id === 'firstName') initial[f.id] = user?.firstName || '';
        else if (f.id === 'lastName') initial[f.id] = user?.lastName || '';
        else if (f.id === 'email') initial[f.id] = user?.email || '';
        else if (f.id === 'phone') initial[f.id] = user?.phone || '';
        else initial[f.id] = '';
      });
      setFormData(initial);
      setStep('cart');
      setErrors({});
      setCouponCode('');
      setCouponDiscount(0);
      setCouponApplied(false);
      setSplitPayment(false);
      setSplitAmounts({});
      setSelectedPickupAddress(null);
      setFulfilment('delivery');
      setLoyaltyPoints(''); setLoyaltyDiscount(0); setLoyaltyApplied(false);
      setGiftCardCode(''); setGiftCardDiscount(0); setGiftCardBalance(0); setGiftCardApplied(false);
    }
  }, [open, user]);

  // Fetch Pesa Coins balance & settings when drawer opens
  useEffect(() => {
    if (open && isAuthenticated) {
      loyaltyAPI.getBalance().then(r => { if (r.data?.success) setLoyaltyBalance(r.data.data.balance || 0); }).catch(() => {});
      loyaltyAPI.getPublicSettings().then(r => { if (r.data?.success) setLoyaltySettings(r.data.data); }).catch(() => {});
    }
  }, [open, isAuthenticated]);

  const handleApplyLoyalty = async () => {
    const pts = parseInt(loyaltyPoints);
    if (!pts || pts <= 0) { toast.error('Enter a valid points amount'); return; }
    if (pts > loyaltyBalance) { toast.error(`You only have ${loyaltyBalance} points`); return; }
    try {
      console.log('[DEBUG] Sending redemption request:', { points: pts, orderTotal: grandSubtotal, loyaltySettings });
      const res = await loyaltyAPI.calculateRedemption(pts, grandSubtotal);
      console.log('[DEBUG] Redemption response:', res.data);
      if (res.data?.success) {
        setLoyaltyDiscount(res.data.data.value || 0);
        setLoyaltyApplied(true);
        toast.success(`${res.data.data.points} PESA Coins applied: -${formatPrice(res.data.data.value)}`);
      }
    } catch (err) { 
      console.error('[DEBUG] Redemption error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to apply PESA Coins'); 
    }
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) { toast.error('Enter a gift card code'); return; }
    setGiftCardLoading(true);
    try {
      const res = await giftCardsAPI.validate(giftCardCode.trim().toUpperCase().replace(/-/g, ''));
      const gc = res.data?.data;
      const bal = gc?.balance ?? gc?.giftCard?.balance ?? 0;
      if (bal <= 0) { toast.error('This gift card has no remaining balance'); return; }
      const disc = Math.min(bal, grandSubtotal);
      setGiftCardDiscount(disc); setGiftCardBalance(bal); setGiftCardApplied(true);
      toast.success(`Gift card applied! -${formatPrice(disc)}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired gift card'); }
    finally { setGiftCardLoading(false); }
  };

  const items = cart.items;
  const cashItems = items.filter(i => !i.laybye);
  const laybyeItems = items.filter(i => !!i.laybye);

  const cashSubtotal = cashItems.reduce((t, i) => {
    const p = i.product.salePrice || i.product.regularPrice || 0;
    const inst = (i.recurring?.paymentMode === 'upfront' && i.recurring?.instances) ? i.recurring.instances : 1;
    return t + p * i.quantity * inst;
  }, 0);
  const laybyeSubtotal = laybyeItems.reduce((t, i) => t + (i.product.salePrice || i.product.regularPrice || 0) * i.quantity, 0);
  const laybyeDepositTotal = laybyeItems.reduce((t, i) => t + (i.laybye?.deposit || 0) * i.quantity, 0);
  const grandSubtotal = cashSubtotal + laybyeSubtotal;
  const totalDiscounts = couponDiscount + loyaltyDiscount + giftCardDiscount;
  const grandTotal = Math.max(0, grandSubtotal - totalDiscounts);
  const dueNow = Math.max(0, cashSubtotal - totalDiscounts) + laybyeDepositTotal;

  const fields = useMemo(() =>
    (cd.fields || []).filter(f => f.enabled).sort((a, b) => a.order - b.order),
    [cd.fields]
  );

  const validate = () => {
    const errs = {};
    fields.forEach(f => {
      if (f.required && !formData[f.id]?.trim()) errs[f.id] = `${f.label} is required`;
      if (f.type === 'email' && formData[f.id] && !/\S+@\S+\.\S+/.test(formData[f.id])) errs[f.id] = 'Invalid email';
    });
    if (fulfilment === 'pickup' && pickupAddresses.length > 0 && !selectedPickupAddress) {
      toast.error('Please select a pickup location');
      setErrors(errs);
      return false;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const orderMutation = useMutation(
    (orderData) => ordersAPI.create(orderData),
    {
      onSuccess: (response, orderData) => {
        toast.success('Order placed successfully!');
        const orderId = response.data?.data?._id || response.data?._id;
        trackPurchase(orderId, orderData.items);
        cart.clearCart();
        onClose();
        if (typeof onOrderPlaced === 'function') {
          onOrderPlaced(orderId, response);
        } else if (orderId) {
          navigate(`/order-success/${orderId}`);
        }
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to place order'),
    }
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const cartItems = items.map(i => ({ product: i.product._id, quantity: i.quantity }));
      const res = await couponsAPI.publicValidate(couponCode, grandSubtotal, cartItems);
      const discount = res.data?.data?.discount || 0;
      setCouponDiscount(discount);
      setCouponApplied(true);
      toast.success(`Coupon applied! You save ${formatPrice(discount)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponDiscount(0);
      setCouponApplied(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!validate()) { setStep('details'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    // Build payment methods array for split payments
    const payments = [];
    if (splitPayment && Object.keys(splitAmounts).length > 0) {
      Object.entries(splitAmounts).forEach(([method, amount]) => {
        if (amount > 0) payments.push({ method, amount: parseFloat(amount) });
      });
    } else {
      if (cashSubtotal > 0) payments.push({ method: paymentMethods.cash, amount: Math.max(0, cashSubtotal - totalDiscounts) });
      if (laybyeDepositTotal > 0) payments.push({ method: paymentMethods.laybye, amount: laybyeDepositTotal });
    }

    // Group laybye items by plan
    const laybyeGroups = {};
    laybyeItems.forEach(item => {
      const planId = item.laybye.plan._id;
      if (!laybyeGroups[planId]) {
        laybyeGroups[planId] = { plan: item.laybye.plan, items: [], totalDeposit: 0 };
      }
      laybyeGroups[planId].items.push(item);
      laybyeGroups[planId].totalDeposit += (item.laybye.deposit || 0) * item.quantity;
    });

    const currencyState = useCurrencyStore.getState ? useCurrencyStore.getState() : {};
    const selCurrency = currencyState.selectedCurrency;

    const orderData = {
      items: items.map(i => ({
        product: i.product._id,
        name: i.product.name,
        price: i.product.salePrice || i.product.regularPrice,
        quantity: i.quantity,
        image: i.product.images?.[0] || i.product.featuredImage,
        variant: i.variant || undefined,
        isLaybye: !!i.laybye,
        laybyePlanId: i.laybye?.plan?._id || undefined,
        laybyeDeposit: i.laybye?.deposit || 0,
        laybyeInstallment: i.laybye?.installment || 0,
      })),
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        street: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
      },
      deliveryMethod: fulfilment,
      pickupAddress: fulfilment === 'pickup' && selectedPickupAddress ? { label: selectedPickupAddress.label, address: selectedPickupAddress.address } : undefined,
      orderNotes: formData.notes || '',
      subtotal: grandSubtotal,
      discount: totalDiscounts,
      couponDiscount: couponDiscount || 0,
      loyaltyDiscount: loyaltyDiscount || 0,
      loyaltyPointsUsed: loyaltyApplied ? parseInt(loyaltyPoints) : 0,
      giftCardDiscount: giftCardDiscount || 0,
      giftCardCode: giftCardApplied ? giftCardCode : undefined,
      total: grandTotal,
      dueNow,
      currency: selCurrency?.code || 'ZAR',
      exchangeRate: selCurrency?.exchangeRate || 1,
      couponCode: couponApplied ? couponCode : undefined,
      hasLaybye: laybyeItems.length > 0,
      laybyeGroups: Object.values(laybyeGroups).map(g => ({
        planId: g.plan._id,
        planName: g.plan.name,
        deposit: g.totalDeposit,
        items: g.items.map(i => ({ product: i.product._id, quantity: i.quantity })),
      })),
      payments,
      paymentMethod: payments[0]?.method || 'eft',
      sessionId: sessionStorage.getItem('pesa_sid') || undefined,
    };

    orderMutation.mutate(orderData);
  };

  // Laybye plan helpers for per-item selector
  const getPlansForProduct = (prod) => {
    const price = prod.salePrice || prod.regularPrice || 0;
    return allPlans.filter(p => {
      if (p.minimumProductValue > 0 && price < p.minimumProductValue) return false;
      if (p.maximumProductValue > 0 && price > p.maximumProductValue) return false;
      return true;
    });
  };
  const calcDeposit = (plan, price) => {
    if (!plan) return 0;
    if (plan.depositAmount > 0) return Math.min(plan.depositAmount, price);
    return (price * (plan.depositPercentage || 20)) / 100;
  };
  const calcInstallment = (plan, price) => {
    if (!plan) return 0;
    const dep = calcDeposit(plan, price);
    return (price - dep) / (plan.numberOfPayments || 1);
  };

  const imageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string' && img.startsWith('http')) return img;
    return `${API_URL}${img}`;
  };

  // Handle laybye checkbox click - checks auth and eligibility
  const handleLaybyeToggle = async (e, idx, plans, price) => {
    if (e.target.checked) {
      // Check if user is logged in first
      if (!isAuthenticated) {
        openAuthModal('login');
        toast('Please sign in or register to use laybye', { icon: '🔐' });
        return;
      }

      // Store pending laybye item
      const plan = plans[0];
      setPendingLaybyeItem({ idx, plan, price, plans });

      // Check eligibility
      try {
        const res = await laybyAPI.checkEligibility();
        const data = res.data;
        setLaybyeEligibility(data);

        if (data.eligible) {
          // Auto-approved - apply laybye directly
          const dep = calcDeposit(plan, price);
          const inst = calcInstallment(plan, price);
          cart.setItemLaybye(idx, { plan, deposit: dep, installment: inst });
          toast.success('You\'re approved for laybye!');
          setPendingLaybyeItem(null);
        } else if (data.pending) {
          // Pending review - show message
          toast('Your laybye application is under review', { icon: '⏳' });
          setPendingLaybyeItem(null);
        } else {
          // Not eligible - show application modal
          setShowLaybyeWidget(true);
        }
      } catch {
        // If check fails, show application modal
        setShowLaybyeWidget(true);
      }
    } else {
      // Unchecking - clear laybye
      cart.clearItemLaybye(idx);
      setPendingLaybyeItem(null);
    }
  };

  // Handle successful laybye application from widget
  const handleLaybyeWidgetClose = () => {
    setShowLaybyeWidget(false);
    // Re-check eligibility after application
    if (pendingLaybyeItem) {
      laybyAPI.checkEligibility().then((res) => {
        if (res.data?.eligible) {
          const { idx, plan, price } = pendingLaybyeItem;
          const dep = calcDeposit(plan, price);
          const inst = calcInstallment(plan, price);
          cart.setItemLaybye(idx, { plan, deposit: dep, installment: inst });
          toast.success('Laybye approved!');
        }
        setPendingLaybyeItem(null);
      }).catch(() => {
        setPendingLaybyeItem(null);
      });
    }
  };

  if (!open) return null;

  const drawerWidth = cd.width || '520px';
  const position = cd.position || 'right';
  const pc = theme.primaryColor || '#1b5e35';
  const ac = theme.accentColor || '#a8ffca';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {cd.showOverlay !== false && (
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', animation: 'cdFadeIn 0.2s ease-out' }} />
      )}

      <div style={{
        position: 'absolute', top: 0, bottom: 0, [position]: 0,
        width: drawerWidth, maxWidth: '100vw', background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
        animation: `cdSlideIn${position === 'right' ? 'R' : 'L'} 0.3s ease-out`,
      }}>
        {/* ── Header ── */}
        <div style={{ padding: '14px 20px', background: pc, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
              {step === 'confirmation' ? '✅ Order Confirmed!' : step === 'details' ? '📋 Details & Payment' : `🛒 Checkout (${items.length} items)`}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ═══════ CONFIRMATION STEP ═══════ */}
          {step === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Thank You!</h3>
              <p style={{ fontSize: 13, color: '#76889a', marginBottom: 14 }}>Order placed. Confirmation sent to <strong>{formData.email}</strong></p>
              {fulfilment === 'pickup' && selectedPickupAddress && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, textAlign: 'left' }}>
                  <strong>🏪 Pickup Location:</strong>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>{selectedPickupAddress.label}</div>
                  <div style={{ color: '#76889a' }}>📍 {selectedPickupAddress.address}</div>
                </div>
              )}
              {laybyeItems.length > 0 && (
                <div style={{ background: '#fefce8', border: '1px solid #fbbf24', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, textAlign: 'left' }}>
                  <strong>💳 {laybyeItems.length} Laybye(s) Created:</strong>
                  {laybyeItems.map((li, idx) => (
                    <div key={idx} style={{ marginTop: 4 }}>• {li.product.name} — {li.laybye.plan.name} ({formatPrice(li.laybye.deposit * li.quantity)} deposit)</div>
                  ))}
                  <p style={{ marginTop: 6, fontSize: 11, color: '#92400e' }}>Track your laybyes in My Account → Laybyes</p>
                </div>
              )}
              <button onClick={onClose} style={{ padding: '10px 24px', background: pc, color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 4 }}>Continue Shopping</button>
            </div>
          )}

          {/* ═══════ CART STEP ═══════ */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <p style={{ fontSize: 36, marginBottom: 8 }}>🛒</p>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div>
                  {/* ── Cart Items ── */}
                  {items.map((item, idx) => {
                    const price = item.product.salePrice || item.product.regularPrice || 0;
                    const recurringInstances = (item.recurring?.paymentMode === 'upfront' && item.recurring?.instances) ? item.recurring.instances : 1;
                    const itemTotal = price * item.quantity * recurringInstances;
                    const plans = getPlansForProduct(item.product);
                    const hasLaybye = !!item.laybye;
                    const hasRecurring = !!item.recurring;
                    const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Every 2 wks', monthly: 'Monthly', bimonthly: 'Every 2 mo', quarterly: 'Quarterly' };

                    return (
                      <div key={`${item.product._id}-${idx}`} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {item.product.images?.[0] && (
                            <img src={imageUrl(item.product.images[0])} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                            <div style={{ fontSize: 12, color: '#76889a', marginTop: 2 }}>{formatPrice(price)} each</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(itemTotal)}</div>
                            <button onClick={() => cart.removeItem(idx)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>Remove</button>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 4 }}>
                            <button onClick={() => cart.updateQuantity(idx, item.quantity - 1)} style={{ width: 28, height: 28, border: 'none', background: '#f9fafb', cursor: 'pointer', fontSize: 14 }}>−</button>
                            <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{item.quantity}</span>
                            <button onClick={() => cart.updateQuantity(idx, item.quantity + 1)} style={{ width: 28, height: 28, border: 'none', background: '#f9fafb', cursor: 'pointer', fontSize: 14 }}>+</button>
                          </div>

                          {/* Laybye toggle — prominent CTA */}
                          {plans.length > 0 && (
                            <label
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', marginLeft: 'auto',
                                padding: '5px 12px', borderRadius: 20,
                                background: hasLaybye ? pc : `linear-gradient(135deg, ${pc}, #2d8a56)`,
                                color: hasLaybye ? ac : '#fff',
                                border: hasLaybye ? `2px solid ${ac}` : '2px solid transparent',
                                boxShadow: hasLaybye
                                  ? `0 0 12px ${ac}, 0 0 4px ${pc}`
                                  : `0 0 8px rgba(27,94,53,0.4)`,
                                animation: hasLaybye ? 'none' : 'cdLaybyePulse 2s ease-in-out infinite',
                                transition: 'all 0.3s ease',
                                letterSpacing: 0.3,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={hasLaybye}
                                onChange={(e) => handleLaybyeToggle(e, idx, plans, price)}
                                style={{ width: 14, height: 14, accentColor: ac }}
                              />
                              {hasLaybye ? '✅ On Laybye' : '💳 Get it on Laybye'}
                            </label>
                          )}
                        </div>

                        {/* Laybye plan selector (when enabled) */}
                        {hasLaybye && plans.length > 0 && (
                          <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: pc }}>Plan:</span>
                              <select
                                value={item.laybye.plan._id}
                                onChange={(e) => {
                                  const plan = plans.find(p => p._id === e.target.value);
                                  if (plan) {
                                    const dep = calcDeposit(plan, price);
                                    const inst = calcInstallment(plan, price);
                                    cart.setItemLaybye(idx, { plan, deposit: dep, installment: inst });
                                  }
                                }}
                                style={{ flex: 1, fontSize: 11, padding: '3px 6px', border: '1px solid #bbf7d0', borderRadius: 4, background: '#fff' }}
                              >
                                {plans.map(p => (
                                  <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8, color: '#374151' }}>
                              <span>Deposit: <strong>{formatPrice(item.laybye.deposit * item.quantity)}</strong></span>
                              <span>•</span>
                              <span>{item.laybye.plan.numberOfPayments}× {formatPrice(item.laybye.installment * item.quantity)}/{item.laybye.plan.frequency === 'weekly' ? 'wk' : item.laybye.plan.frequency === 'biweekly' ? '2wk' : 'mo'}</span>
                            </div>
                          </div>
                        )}

                        {/* Recurring — badge when already set, toggle when not (and no layby) */}
                        {!hasLaybye && (
                          <>
                            {hasRecurring ? (
                              <div style={{ marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                                <div>
                                  <span style={{ fontWeight: 700, color: '#166534' }}>🔄 Recurring — </span>
                                  <span style={{ color: '#374151' }}>
                                    {FREQ_LABELS[item.recurring.frequency] || item.recurring.frequency}
                                    {item.recurring.paymentMode === 'upfront' && item.recurring.instances ? ` · ${item.recurring.instances} deliveries upfront` : ' · Pay as you go'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => cart.clearItemRecurring(idx)}
                                  style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 }}
                                >
                                  Remove
                                </button>
                              </div>
                            ) : allRecurringPlans.length > 0 && (
                              <label style={{
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', marginTop: 6,
                                padding: '5px 12px', borderRadius: 20,
                                background: 'transparent',
                                color: '#166534',
                                border: '1.5px solid #bbf7d0',
                                width: 'fit-content',
                              }}>
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => {
                                    const plan = allRecurringPlans[0];
                                    cart.setItemRecurring(idx, {
                                      frequency: plan.frequency,
                                      paymentMode: plan.allowedPaymentModes?.[0] || 'pay_as_you_go',
                                      instances: null,
                                      recurringPlanId: plan._id,
                                    });
                                  }}
                                  style={{ width: 12, height: 12, accentColor: '#1b5e35' }}
                                />
                                🔄 Set up Recurring
                                <span style={{ fontWeight: 400, color: '#76889a', marginLeft: 2 }}>
                                  ({allRecurringPlans.map(p => FREQ_LABELS[p.frequency]).join(', ')})
                                </span>
                              </label>
                            )}

                            {/* Recurring plan selector when set from checkout */}
                            {hasRecurring && allRecurringPlans.length > 1 && (
                              <div style={{ marginTop: 4, padding: '4px 6px', fontSize: 11 }}>
                                <select
                                  value={item.recurring.recurringPlanId || ''}
                                  onChange={(e) => {
                                    const plan = allRecurringPlans.find(p => p._id === e.target.value);
                                    if (plan) {
                                      cart.setItemRecurring(idx, {
                                        ...item.recurring,
                                        frequency: plan.frequency,
                                        recurringPlanId: plan._id,
                                      });
                                    }
                                  }}
                                  style={{ fontSize: 11, padding: '3px 6px', border: '1px solid #bbf7d0', borderRadius: 4 }}
                                >
                                  {allRecurringPlans.map(p => (
                                    <option key={p._id} value={p._id}>{FREQ_LABELS[p.frequency] || p.frequency}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Summary Section ── */}
                  <div style={{ marginTop: 16, borderTop: '2px solid #e5eae6', paddingTop: 14 }}>
                    {cashItems.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#374151' }}>💵 Cash items ({cashItems.length})</span>
                        <span style={{ fontWeight: 600 }}>{formatPrice(cashSubtotal)}</span>
                      </div>
                    )}
                    {laybyeItems.length > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                          <span style={{ color: '#374151' }}>💳 Laybye items ({laybyeItems.length})</span>
                          <span style={{ fontWeight: 600 }}>{formatPrice(laybyeSubtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: pc }}>
                          <span style={{ paddingLeft: 18 }}>Deposits due now</span>
                          <span style={{ fontWeight: 700 }}>{formatPrice(laybyeDepositTotal)}</span>
                        </div>
                      </>
                    )}
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', marginBottom: 4 }}>
                        <span>Coupon</span>
                        <span>-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', marginBottom: 4 }}>
                        <span>⭐ PESA Coins</span>
                        <span>-{formatPrice(loyaltyDiscount)}</span>
                      </div>
                    )}
                    {giftCardDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0284c7', marginBottom: 4 }}>
                        <span>🎁 Gift Card</span>
                        <span>-{formatPrice(giftCardDiscount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, borderTop: '1px solid #e5eae6', paddingTop: 8, marginTop: 6 }}>
                      <span>Due Now</span>
                      <span style={{ color: pc }}>{formatPrice(dueNow)}</span>
                    </div>
                    {laybyeItems.length > 0 && (
                      <div style={{ fontSize: 11, color: '#76889a', marginTop: 2 }}>
                        Total value: {formatPrice(grandTotal)} (remaining {formatPrice(grandTotal - dueNow)} via installments)
                      </div>
                    )}
                  </div>

                  {/* Coupon */}
                  {cd.showCouponField !== false && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Coupon code" disabled={couponApplied}
                          style={{ flex: 1, padding: '7px 10px', border: '1px solid #d1d5db', fontSize: 12, borderRadius: 4, outline: 'none' }}
                        />
                        <button
                          onClick={couponApplied ? () => { setCouponCode(''); setCouponDiscount(0); setCouponApplied(false); } : handleApplyCoupon}
                          style={{ padding: '7px 14px', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 4, background: couponApplied ? '#ef4444' : '#f5b800', color: couponApplied ? '#fff' : '#1a1a1a' }}
                        >
                          {couponApplied ? '✕' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── PESA Coins ── */}
                  {isAuthenticated && loyaltyBalance > 0 && loyaltySettings?.enabled && (
                    <div style={{ marginTop: 12, padding: 10, background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>⭐ PESA Coins — <span style={{ fontWeight: 800 }}>{loyaltyBalance}</span> available (worth {formatPrice(loyaltyBalance * (loyaltySettings.redemptionRate || 0))})</div>
                      {loyaltyApplied ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '6px 8px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>{loyaltyPoints} coins = -{formatPrice(loyaltyDiscount)}</span>
                            <button onClick={() => { setLoyaltyApplied(false); setLoyaltyDiscount(0); setLoyaltyPoints(''); }} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Remove</button>
                          </div>
                          <div style={{ fontSize: 10, color: '#92400e', marginTop: 4, textAlign: 'right' }}>
                            Balance left: {loyaltyBalance - parseInt(loyaltyPoints || 0)} coins (worth {formatPrice((loyaltyBalance - parseInt(loyaltyPoints || 0)) * (loyaltySettings.redemptionRate || 0))})
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input type="number" min="1" max={loyaltyBalance} value={loyaltyPoints} onChange={(e) => setLoyaltyPoints(e.target.value)} placeholder="Points to use" style={{ flex: 1, padding: '6px 8px', border: '1px solid #fbbf24', fontSize: 11, borderRadius: 4, outline: 'none' }} />
                          <button onClick={handleApplyLoyalty} style={{ padding: '6px 12px', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 4, background: '#f59e0b', color: '#fff' }}>Apply</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Gift Card ── */}
                  <div style={{ marginTop: 12, padding: 10, background: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>🎁 Gift Card</span>
                      <a href="/gift-cards" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', textDecoration: 'none', background: '#f5f3ff', border: '1px solid #c4b5fd', padding: '3px 8px', borderRadius: 4 }}>
                        🛒 Buy a Gift Card
                      </a>
                    </div>
                    {giftCardApplied ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '6px 8px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Gift card: -{formatPrice(giftCardDiscount)} (bal: {formatPrice(giftCardBalance)})</span>
                        <button onClick={() => { setGiftCardApplied(false); setGiftCardDiscount(0); setGiftCardBalance(0); setGiftCardCode(''); }} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="text" value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)} placeholder="Gift card code" style={{ flex: 1, padding: '6px 8px', border: '1px solid #7dd3fc', fontSize: 11, borderRadius: 4, outline: 'none' }} />
                        <button onClick={handleApplyGiftCard} disabled={giftCardLoading} style={{ padding: '6px 12px', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderRadius: 4, background: '#0ea5e9', color: '#fff', opacity: giftCardLoading ? 0.6 : 1 }}>{giftCardLoading ? '...' : 'Apply'}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════ DETAILS & PAYMENT STEP ═══════ */}
          {step === 'details' && (
            <>
              {/* Delivery / Pickup */}
              {cd.showDeliveryPickupChoice !== false && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, display: 'block' }}>Fulfilment</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['delivery', 'pickup'].map(m => (
                      <button key={m} onClick={() => {
                        setFulfilment(m);
                        if (m === 'pickup' && pickupAddresses.length > 0 && !selectedPickupAddress) {
                          setSelectedPickupAddress(pickupAddresses[0]);
                        }
                      }} style={{
                        flex: 1, padding: '8px', border: fulfilment === m ? `2px solid ${pc}` : '1px solid #e5eae6',
                        background: fulfilment === m ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center', borderRadius: 4,
                      }}>
                        {m === 'delivery' ? (cd.deliveryLabel || '🚚 Delivery') : (cd.pickupLabel || '🏪 Pickup')}
                      </button>
                    ))}
                  </div>
                  {fulfilment === 'pickup' && pickupAddresses.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Select pickup location:</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {pickupAddresses.map((addr, aIdx) => (
                          <label key={aIdx} onClick={() => setSelectedPickupAddress(addr)} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', cursor: 'pointer', borderRadius: 4,
                            border: selectedPickupAddress?.address === addr.address ? `2px solid ${pc}` : '1px solid #e5eae6',
                            background: selectedPickupAddress?.address === addr.address ? '#f0fdf4' : '#fff',
                          }}>
                            <input
                              type="radio" name="pickupAddr" checked={selectedPickupAddress?.address === addr.address}
                              onChange={() => setSelectedPickupAddress(addr)}
                              style={{ marginTop: 2, accentColor: pc }}
                            />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{addr.label}</div>
                              <div style={{ fontSize: 11, color: '#76889a' }}>📍 {addr.address}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {fields.map((field) => {
                  const isFullWidth = ['address', 'notes', 'email'].includes(field.id) || field.type === 'textarea';
                  return (
                    <div key={field.id} style={{ gridColumn: isFullWidth ? '1 / -1' : undefined }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3 }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea value={formData[field.id] || ''} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          placeholder={field.placeholder} rows={2}
                          style={{ width: '100%', padding: '7px 9px', border: errors[field.id] ? '2px solid #ef4444' : '1px solid #d1d5db', fontSize: 12, resize: 'none', outline: 'none', borderRadius: 4 }}
                        />
                      ) : field.type === 'select' ? (
                        <select value={formData[field.id] || ''} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          style={{ width: '100%', padding: '7px 9px', border: errors[field.id] ? '2px solid #ef4444' : '1px solid #d1d5db', fontSize: 12, background: '#fff', outline: 'none', borderRadius: 4 }}
                        >
                          <option value="">{field.placeholder || 'Select...'}</option>
                          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input type={field.type || 'text'} value={formData[field.id] || ''} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                          placeholder={field.placeholder}
                          style={{ width: '100%', padding: '7px 9px', border: errors[field.id] ? '2px solid #ef4444' : '1px solid #d1d5db', fontSize: 12, outline: 'none', borderRadius: 4 }}
                        />
                      )}
                      {errors[field.id] && <p style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>{errors[field.id]}</p>}
                    </div>
                  );
                })}
              </div>

              {/* ── Payment Method ── */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 6, display: 'block' }}>Payment Method</label>

                {/* Split payment toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 8, cursor: 'pointer', color: '#6b7280' }}>
                  <input type="checkbox" checked={splitPayment} onChange={(e) => setSplitPayment(e.target.checked)} style={{ width: 14, height: 14, accentColor: pc }} />
                  Split payment across multiple methods
                </label>

                {!splitPayment ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {PAYMENT_METHODS.map(m => {
                      const isSelected = paymentMethods.cash === m.id;
                      return (
                        <button key={m.id} onClick={() => setPaymentMethods({ ...paymentMethods, cash: m.id, laybye: m.id })}
                          style={{
                            padding: '8px 6px', border: isSelected ? `2px solid ${pc}` : '1px solid #e5eae6',
                            background: isSelected ? '#f0fdf4' : '#fff',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600, borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          }}
                        >
                          {m.displayType === 'image' && m.image ? (
                            <img src={m.image.startsWith('http') ? m.image : `${API_URL}${m.image}`} alt="" style={{ height: 18, objectFit: 'contain' }} />
                          ) : m.displayType === 'text' ? null : (
                            <SmartIcon value={m.icon} size={16} />
                          )}
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5eae6', borderRadius: 6, padding: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Allocate {formatPrice(dueNow)} across methods:</p>
                    {PAYMENT_METHODS.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, width: 140, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {m.displayType === 'image' && m.image ? (
                            <img src={m.image.startsWith('http') ? m.image : `${API_URL}${m.image}`} alt="" style={{ height: 16, objectFit: 'contain' }} />
                          ) : m.displayType === 'text' ? null : (
                            <SmartIcon value={m.icon} size={14} />
                          )}
                          {m.label}
                        </span>
                        <input
                          type="number" min="0" step="0.01"
                          value={splitAmounts[m.id] || ''}
                          onChange={(e) => setSplitAmounts({ ...splitAmounts, [m.id]: e.target.value })}
                          placeholder="0.00"
                          style={{ flex: 1, padding: '5px 8px', border: '1px solid #d1d5db', fontSize: 12, borderRadius: 4, outline: 'none' }}
                        />
                      </div>
                    ))}
                    {(() => {
                      const allocated = Object.values(splitAmounts).reduce((t, v) => t + (parseFloat(v) || 0), 0);
                      const diff = dueNow - allocated;
                      return Math.abs(diff) > 0.01 ? (
                        <p style={{ fontSize: 10, color: diff > 0 ? '#ef4444' : '#f59e0b', marginTop: 4 }}>
                          {diff > 0 ? `${formatPrice(diff)} still unallocated` : `${formatPrice(Math.abs(diff))} over-allocated`}
                        </p>
                      ) : (
                        <p style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>✓ Fully allocated</p>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Checkout offers */}
              {checkoutOffers.length > 0 && (
                <div style={{ marginBottom: 12, padding: '10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🏷️ Special Offers
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {checkoutOffers.map(offer => (
                      <OfferCard key={offer._id} offer={offer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Order summary compact */}
              <div style={{ borderTop: '2px solid #e5eae6', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                  <span>Due Now</span>
                  <span style={{ color: pc }}>{formatPrice(dueNow)}</span>
                </div>
                {laybyeItems.length > 0 && (
                  <div style={{ fontSize: 11, color: '#76889a', marginTop: 2 }}>
                    {cashItems.length > 0 && <>💵 Cash: {formatPrice(cashSubtotal - couponDiscount)} · </>}
                    💳 Deposits: {formatPrice(laybyeDepositTotal)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== 'confirmation' && (
          <div style={{ padding: '14px 20px', borderTop: '2px solid #e5eae6', flexShrink: 0, background: '#fafbfc' }}>
            {step === 'cart' ? (
              <button
                onClick={() => { if (items.length === 0) { toast.error('Add items to cart first'); return; } setStep('details'); }}
                style={{
                  width: '100%', padding: '13px', background: pc, color: ac, border: 'none',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, borderRadius: 4,
                  textShadow: `0 0 12px ${ac}`, position: 'relative', overflow: 'hidden',
                }}
              >
                Proceed to Checkout — {formatPrice(dueNow)}
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'cdShimmer 2s infinite' }} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('cart')} style={{ padding: '13px 16px', border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 4 }}>
                  ← Cart
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={orderMutation.isLoading}
                  style={{
                    flex: 1, padding: '13px', background: pc, color: ac, border: 'none',
                    fontSize: 14, fontWeight: 800, cursor: orderMutation.isLoading ? 'wait' : 'pointer',
                    opacity: orderMutation.isLoading ? 0.7 : 1, borderRadius: 4,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {orderMutation.isLoading ? 'Placing Order...' : laybyeItems.length > 0 ? `Place Order — ${formatPrice(dueNow)} now` : `Place Order — ${formatPrice(dueNow)}`}
                  <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'cdShimmer 2s infinite' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 6 }}>
              🔒 Secure checkout · Your data is encrypted
            </p>
          </div>
        )}
      </div>

      {/* Laybye Application Modal */}
      {showLaybyeWidget && pendingLaybyeItem && (
        <LaybyWidget
          product={items[pendingLaybyeItem.idx]?.product}
          selectedPlan={{
            plan: pendingLaybyeItem.plan,
            deposit: calcDeposit(pendingLaybyeItem.plan, pendingLaybyeItem.price),
            installment: calcInstallment(pendingLaybyeItem.plan, pendingLaybyeItem.price)
          }}
          showButton={false}
          isOpen={showLaybyeWidget}
          onClose={handleLaybyeWidgetClose}
        />
      )}

      <style>{`
        @keyframes cdFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cdSlideInR { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cdSlideInL { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes cdShimmer { from { left: -100%; } to { left: 100%; } }
        @keyframes cdLaybyePulse {
          0%, 100% { box-shadow: 0 0 6px rgba(27,94,53,0.3), 0 0 0 0 rgba(168,255,202,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 14px rgba(27,94,53,0.5), 0 0 20px 4px rgba(168,255,202,0.25); transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
