import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useCartStore,
  useUIStore,
  useAuthStore,
  useCurrencyStore,
} from "@/store";
import {
  ordersAPI,
  couponsAPI,
  laybyPlansAPI,
  productPageSettingsAPI,
  paymentMethodsAPI,
  giftCardsAPI,
  loyaltyAPI,
  settingsAPI,
  authAPI,
} from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";
import PulsingArrows from "@/components/PulsingArrows";
import Toast from "react-native-toast-message";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CheckoutDrawer() {
  const {
    checkoutDrawerOpen,
    closeCheckoutDrawer,
    checkoutDrawerProduct,
    checkoutDrawerQuantity,
    checkoutDrawerVariant,
    checkoutDrawerLaybye,
  } = useUIStore();
  const cart = useCartStore();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // ── Steps ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"cart" | "details" | "confirmation">("cart");
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");

  // ── Auth form (inline, shown when not logged-in at checkout) ──────────────
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── Payment methods (dynamic from API) ────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  // ── Coupon ────────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // ── Gift Card (stored in cart store) ─────────────────────────────────────
  const [giftCardInput, setGiftCardInput] = useState("");
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  // ── PESA Coins ────────────────────────────────────────────────────────────
  const [pesaBalance, setPesaBalance] = useState(0);
  const [pesaCoinsInput, setPesaCoinsInput] = useState("");
  const [pesaDiscount, setPesaDiscount] = useState(0);
  const [pesaApplied, setPesaApplied] = useState(false);
  const [pesaCalculating, setPesaCalculating] = useState(false);
  const [pesaEnabled, setPesaEnabled] = useState(false); // loyalty module enabled

  // ── Laybye per-item ───────────────────────────────────────────────────────
  const [laybyePlans, setLaybyePlans] = useState<Record<string, any[]>>({});
  const [laybyeLoading, setLaybyeLoading] = useState<Record<string, boolean>>({});
  const [expandedLaybye, setExpandedLaybye] = useState<string | null>(null);

  // ── Free Shipping ─────────────────────────────────────────────────────────
  const [freeShippingMin, setFreeShippingMin] = useState(0);

  // ── Form / pickup ─────────────────────────────────────────────────────────
  const [pickupAddresses, setPickupAddresses] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── On drawer open: init ──────────────────────────────────────────────────
  useEffect(() => {
    if (!checkoutDrawerOpen) return;

    // Animation
    setStep("cart");
    setShowAuthForm(false);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Fetch payment methods
    paymentMethodsAPI.getActive().then((res) => {
      const methods = res.data?.data || res.data || [];
      if (methods.length > 0) {
        setPaymentMethods(methods);
        setPaymentMethod(methods[0].id || methods[0]._id || methods[0].key || "");
      }
    }).catch(() => {});

    // Fetch pickup addresses + free shipping
    productPageSettingsAPI.get().then((res) => {
      const settings = res.data?.data || res.data;
      const pickups = settings?.checkoutDrawer?.pickupAddresses?.filter((p: any) => p.enabled) || [];
      setPickupAddresses(pickups);
      if (pickups.length > 0) setSelectedPickup(pickups[0].label);
    }).catch(() => {});

    settingsAPI.getPublic().then((res) => {
      const d = res.data?.data || res.data;
      const fs = d?.freeShipping || d?.shipping?.freeShipping;
      if (fs?.enabled && fs?.minimumOrderAmount > 0) {
        setFreeShippingMin(fs.minimumOrderAmount);
      }
    }).catch(() => {});

    // Fetch PESA coins if authenticated
    if (isAuthenticated) {
      loyaltyAPI.getMyOverview().then((res) => {
        const d = res.data?.data;
        const balance = d?.balance || d?.points || 0;
        const enabled = d !== undefined;
        setPesaBalance(balance);
        setPesaEnabled(enabled);
      }).catch(() => {});
    }
  }, [checkoutDrawerOpen]);

  // Hide animation
  useEffect(() => {
    if (!checkoutDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [checkoutDrawerOpen]);

  // Populate form from user data
  useEffect(() => {
    if (checkoutDrawerOpen && user) {
      const names = (user.name || "").split(" ");
      const addr = user.addresses?.[0] || {};
      setFormData((f) => ({
        ...f,
        firstName: user.firstName || names[0] || f.firstName,
        lastName: user.lastName || names.slice(1).join(" ") || f.lastName,
        email: user.email || f.email,
        phone: user.phone || f.phone,
        address: addr.street || addr.address || f.address,
        city: addr.city || f.city,
        province: addr.state || addr.province || f.province,
        postalCode: addr.postalCode || addr.zip || f.postalCode,
      }));
    }
  }, [checkoutDrawerOpen, user]);

  // Add product to cart if opened from product page
  useEffect(() => {
    if (checkoutDrawerOpen && checkoutDrawerProduct) {
      const isLaybye = !!checkoutDrawerLaybye;
      cart.addItem(checkoutDrawerProduct, checkoutDrawerQuantity || 1, checkoutDrawerVariant || null, isLaybye);
      if (checkoutDrawerLaybye) {
        const idx = useCartStore.getState().items.findIndex(
          (i) => i.product._id === checkoutDrawerProduct._id && !!i.laybye === isLaybye
        );
        if (idx >= 0) cart.setItemLaybye(idx, checkoutDrawerLaybye);
      }
    }
  }, [checkoutDrawerOpen, checkoutDrawerProduct]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cart.getTotal();
  const giftCardDiscount = cart.giftCardAmount || 0;
  const cashTotal = cart.getCashTotal();
  const laybyeDepositTotal = cart.getLaybyeDepositTotal();
  const totalDiscounts = couponDiscount + giftCardDiscount + pesaDiscount;
  const amountDueNow = Math.max(0, cashTotal + laybyeDepositTotal - totalDiscounts);

  const splitTotal = Object.values(splitAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const splitValid = !splitPayment || Math.abs(splitTotal - amountDueNow) < 0.5;

  // ── Auth handlers ──────────────────────────────────────────────────────────
  const handleAuthSubmit = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      Toast.show({ type: "error", text1: "Please fill in all fields" });
      return;
    }
    if (authMode === "register" && !authName.trim()) {
      Toast.show({ type: "error", text1: "Please enter your name" });
      return;
    }
    setAuthLoading(true);
    try {
      let res;
      if (authMode === "login") {
        res = await authAPI.login({ email: authEmail.trim(), password: authPassword });
      } else {
        res = await authAPI.register({ name: authName.trim(), email: authEmail.trim(), password: authPassword });
      }
      const { user: u, token } = res.data;
      await setAuth(u, token);
      Toast.show({ type: "success", text1: `Welcome${authMode === "login" ? " back" : ""}, ${u.firstName || u.name || "there"}!` });
      setShowAuthForm(false);
      // Refresh loyalty balance
      loyaltyAPI.getMyOverview().then((r) => {
        const d = r.data?.data;
        if (d) { setPesaBalance(d.balance || d.points || 0); setPesaEnabled(true); }
      }).catch(() => {});
      setStep("details");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || `${authMode === "login" ? "Login" : "Registration"} failed` });
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Coupon ────────────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const cartItems = cart.items.map((i) => ({
        product: i.product._id,
        quantity: i.quantity,
        price: i.product.salePrice || i.product.regularPrice,
      }));
      const res = await couponsAPI.validate(couponCode, subtotal, cartItems);
      const discount = res.data?.data?.discount || res.data?.discount || 0;
      setCouponDiscount(discount);
      setCouponApplied(true);
      Toast.show({ type: "success", text1: `Coupon applied! -${formatPrice(discount)}` });
    } catch {
      Toast.show({ type: "error", text1: "Invalid coupon code" });
    }
  };

  // ── Gift Card ──────────────────────────────────────────────────────────────
  const applyGiftCard = async () => {
    if (!giftCardInput.trim()) return;
    setGiftCardLoading(true);
    try {
      const res = await giftCardsAPI.validate(giftCardInput.trim());
      const gc = res.data?.data || res.data;
      if (!gc || gc.isActive === false || (gc.currentBalance || gc.balance || 0) <= 0) {
        Toast.show({ type: "error", text1: "Gift card is invalid or has no balance" });
        return;
      }
      const balance = gc.currentBalance || gc.balance || 0;
      const applyAmount = Math.min(balance, amountDueNow);
      cart.setGiftCard(giftCardInput.trim(), applyAmount, balance);
      Toast.show({ type: "success", text1: `Gift card applied! -${formatPrice(applyAmount)}` });
    } catch {
      Toast.show({ type: "error", text1: "Invalid gift card code" });
    } finally {
      setGiftCardLoading(false);
    }
  };

  const removeGiftCard = () => {
    cart.clearGiftCard();
    setGiftCardInput("");
  };

  // ── PESA Coins ────────────────────────────────────────────────────────────
  const applyPesaCoins = async () => {
    const coins = parseInt(pesaCoinsInput, 10);
    if (!coins || coins <= 0 || coins > pesaBalance) {
      Toast.show({ type: "error", text1: `Enter a valid amount (max ${pesaBalance} coins)` });
      return;
    }
    setPesaCalculating(true);
    try {
      const res = await loyaltyAPI.calculateRedemption(coins, amountDueNow);
      const discount = res.data?.data?.discountAmount || res.data?.discountAmount || 0;
      setPesaDiscount(discount);
      setPesaApplied(true);
      Toast.show({ type: "success", text1: `${coins} PESA Coins applied! -${formatPrice(discount)}` });
    } catch {
      Toast.show({ type: "error", text1: "Could not apply PESA Coins" });
    } finally {
      setPesaCalculating(false);
    }
  };

  const removePesaCoins = () => {
    setPesaApplied(false);
    setPesaDiscount(0);
    setPesaCoinsInput("");
  };

  // ── Laybye per-item ───────────────────────────────────────────────────────
  const toggleLaybyeForItem = async (productId: string) => {
    if (expandedLaybye === productId) {
      setExpandedLaybye(null);
      return;
    }
    if (laybyePlans[productId]) {
      setExpandedLaybye(productId);
      return;
    }
    setLaybyeLoading((s) => ({ ...s, [productId]: true }));
    try {
      const res = await laybyPlansAPI.getForProduct(productId);
      const plans = res.data?.data || res.data || [];
      setLaybyePlans((s) => ({ ...s, [productId]: plans }));
      setExpandedLaybye(productId);
    } catch {
      Toast.show({ type: "error", text1: "Could not load laybye plans" });
    } finally {
      setLaybyeLoading((s) => ({ ...s, [productId]: false }));
    }
  };

  const selectLaybyePlan = (itemIndex: number, plan: any, itemPrice: number) => {
    const depositPct = plan.depositPercentage || plan.deposit || 20;
    const deposit = (depositPct / 100) * itemPrice;
    const installmentCount = plan.installmentCount || plan.numberOfInstallments || 3;
    const remaining = itemPrice - deposit;
    const installment = remaining / installmentCount;
    cart.setItemLaybye(itemIndex, { plan, deposit, installment, installmentCount });
    setExpandedLaybye(null);
  };

  const removeLaybyeFromItem = (itemIndex: number) => {
    cart.clearItemLaybye(itemIndex);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateDetails = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!formData.firstName.trim()) errors.firstName = true;
    if (!formData.email.trim()) errors.email = true;
    if (!formData.phone.trim()) errors.phone = true;
    if (fulfilment === "delivery" && !formData.address.trim()) errors.address = true;
    if (fulfilment === "delivery" && !formData.city.trim()) errors.city = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const missing = [];
      if (errors.firstName) missing.push("Name");
      if (errors.email) missing.push("Email");
      if (errors.phone) missing.push("Phone");
      if (errors.address) missing.push("Address");
      if (errors.city) missing.push("City");
      Toast.show({ type: "error", text1: "Required fields missing", text2: missing.join(", ") });
      return false;
    }
    if (splitPayment && !splitValid) {
      Toast.show({ type: "error", text1: "Split payment amounts must equal total due" });
      return false;
    }
    return true;
  };

  // ── Place Order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const pmLabel = splitPayment
        ? "split"
        : (paymentMethods.find((p) => (p.id || p._id || p.key) === paymentMethod)?.name || paymentMethod);

      const orderData: any = {
        items: cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.regularPrice,
          variant: item.variant?._id || null,
          laybye: item.laybye
            ? { planId: item.laybye.plan?._id, deposit: item.laybye.deposit, installmentAmount: item.laybye.installment }
            : null,
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          street: formData.address,
          city: formData.city,
          state: formData.province,
          postalCode: formData.postalCode,
        },
        fulfilmentMethod: fulfilment,
        paymentMethod: pmLabel,
        couponCode: couponApplied ? couponCode : undefined,
        notes: formData.notes,
        pickupAddress: fulfilment === "pickup" && selectedPickup
          ? (() => { const p = pickupAddresses.find((a) => a.label === selectedPickup); return p ? { label: p.label, address: p.address } : undefined; })()
          : undefined,
        giftCardCode: cart.giftCardCode || undefined,
        giftCardAmount: cart.giftCardAmount > 0 ? cart.giftCardAmount : undefined,
        loyaltyPointsRedeemed: pesaApplied ? parseInt(pesaCoinsInput, 10) : undefined,
        loyaltyDiscount: pesaApplied ? pesaDiscount : undefined,
        splitPayments: splitPayment
          ? Object.entries(splitAmounts)
              .filter(([, amt]) => parseFloat(amt) > 0)
              .map(([methodId, amount]) => ({ method: methodId, amount: parseFloat(amount) }))
          : undefined,
      };

      const res = await ordersAPI.create(orderData);
      const orderId = res.data?.data?._id || res.data?.order?._id;
      cart.clearCart();
      setCouponCode(""); setCouponDiscount(0); setCouponApplied(false);
      setGiftCardInput(""); setPesaCoinsInput(""); setPesaDiscount(0); setPesaApplied(false);
      closeCheckoutDrawer();
      Toast.show({ type: "success", text1: "Order placed successfully!", text2: "Thank you for your purchase" });
      if (orderId) router.push(`/order/${orderId}` as any);
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to place order", text2: err?.response?.data?.message || "Please try again" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkoutDrawerOpen) return null;

  const pmId = (pm: any) => pm.id || pm._id || pm.key || pm.name;
  const pmLabel = (pm: any) => pm.name || pm.label || pm.id || "";
  const pmIcon = (pm: any) => pm.icon || pm.emoji || "💳";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeCheckoutDrawer} />
      </Animated.View>

      <Animated.View style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <View style={s.header}>
            <Text style={s.headerTitle}>
              {showAuthForm ? "Sign In to Continue" : step === "cart" ? "Checkout" : step === "details" ? "Your Details" : "Confirm Order"}
            </Text>
            <Pressable onPress={closeCheckoutDrawer} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>

          {/* ── Step dots ──────────────────────────────────────────────────── */}
          {!showAuthForm && (
            <View style={s.stepsRow}>
              {["cart", "details", "confirmation"].map((s2, i) => (
                <View key={s2} style={[s.stepDot, {
                  backgroundColor: step === s2 || i < ["cart", "details", "confirmation"].indexOf(step)
                    ? colors.primary : colors.gray200,
                }]} />
              ))}
            </View>
          )}

          <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ═══════════════════════════════════════════════════════════════
                AUTH FORM (inline, shown when not logged in)
            ════════════════════════════════════════════════════════════════ */}
            {showAuthForm && (
              <View style={s.authWrap}>
                <Text style={s.authSubtitle}>
                  Sign in or create an account to track your order, earn PESA Coins, and more.
                </Text>

                {/* Mode toggle */}
                <View style={s.authModeRow}>
                  {(["login", "register"] as const).map((m) => (
                    <Pressable key={m} onPress={() => setAuthMode(m)} style={[s.authModeBtn, authMode === m && s.authModeBtnActive]}>
                      <Text style={[s.authModeBtnText, authMode === m && { color: colors.primary }]}>
                        {m === "login" ? "Sign In" : "Create Account"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {authMode === "register" && (
                  <TextInput
                    style={s.input}
                    value={authName}
                    onChangeText={setAuthName}
                    placeholder="Full Name"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="words"
                  />
                )}
                <TextInput
                  style={s.input}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={s.input}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="Password"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry
                />

                <Pressable onPress={handleAuthSubmit} disabled={authLoading} style={[s.primaryBtn, { marginTop: 4 }]}>
                  {authLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.primaryBtnText}>{authMode === "login" ? "Sign In & Continue" : "Create Account & Continue"}</Text>
                  }
                </Pressable>

                <Pressable onPress={() => { setShowAuthForm(false); setStep("details"); }} style={s.guestBtn}>
                  <Text style={s.guestBtnText}>Continue as Guest</Text>
                </Pressable>
              </View>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                STEP: CART
            ════════════════════════════════════════════════════════════════ */}
            {!showAuthForm && step === "cart" && (
              <>
                {/* Free Shipping Progress */}
                {freeShippingMin > 0 && subtotal < freeShippingMin && (
                  <View style={s.freeShipBanner}>
                    <Ionicons name="car-outline" size={14} color={colors.primary} />
                    <Text style={s.freeShipText}>
                      Spend <Text style={{ fontWeight: "700" }}>{formatPrice(freeShippingMin - subtotal)}</Text> more for FREE delivery
                    </Text>
                  </View>
                )}
                {freeShippingMin > 0 && subtotal >= freeShippingMin && (
                  <View style={[s.freeShipBanner, { backgroundColor: "#f0fdf4", borderColor: colors.green600 }]}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.green600} />
                    <Text style={[s.freeShipText, { color: colors.green600 }]}>You qualify for FREE delivery!</Text>
                  </View>
                )}

                {/* Cart Items */}
                {cart.items.map((item, index) => {
                  const imgUrl = resolveImageUrl(item.product.images?.[0]) || resolveImageUrl(item.product.image);
                  const price = item.product.salePrice || item.product.regularPrice;
                  const productId = item.product._id;
                  const isLaybyeExpanded = expandedLaybye === productId;
                  const plans = laybyePlans[productId] || [];
                  const isLoadingPlans = laybyeLoading[productId];

                  return (
                    <View key={`${productId}-${index}`}>
                      <View style={s.cartItem}>
                        <Image source={{ uri: imgUrl }} style={s.cartItemImg} contentFit="cover" />
                        <View style={s.cartItemInfo}>
                          <Text style={s.cartItemName} numberOfLines={2}>{item.product.name}</Text>
                          {item.laybye && (
                            <View style={s.laybyRow}>
                              <Ionicons name="time-outline" size={10} color={colors.amber500} />
                              <Text style={s.laybyText}>Layby: {formatPrice(item.laybye.deposit)} deposit</Text>
                              <Pressable onPress={() => removeLaybyeFromItem(index)} style={s.laybyRemove}>
                                <Ionicons name="close-circle" size={13} color={colors.gray400} />
                              </Pressable>
                            </View>
                          )}
                          <View style={s.cartItemBottom}>
                            <Text style={s.cartItemPrice}>{formatPrice(price * item.quantity)}</Text>
                            <Text style={s.cartItemQty}>Qty: {item.quantity}</Text>
                          </View>
                          {/* Get it on Laybye */}
                          {!item.laybye && (
                            <Pressable
                              onPress={() => toggleLaybyeForItem(productId)}
                              style={s.laybyeChip}
                              disabled={isLoadingPlans}
                            >
                              {isLoadingPlans
                                ? <ActivityIndicator size={10} color={colors.amber500} />
                                : <Ionicons name="time-outline" size={11} color="#d97706" />
                              }
                              <Text style={s.laybyeChipText}>Get it on Laybye</Text>
                              <Ionicons name={isLaybyeExpanded ? "chevron-up" : "chevron-down"} size={11} color="#d97706" />
                            </Pressable>
                          )}
                        </View>
                      </View>

                      {/* Laybye Plan Picker */}
                      {isLaybyeExpanded && plans.length > 0 && (
                        <View style={s.laybyPicker}>
                          <Text style={s.laybyPickerTitle}>Choose a Laybye Plan</Text>
                          {plans.map((plan: any, pi: number) => {
                            const depPct = plan.depositPercentage || plan.deposit || 20;
                            const count = plan.installmentCount || plan.numberOfInstallments || 3;
                            const deposit = (depPct / 100) * price;
                            const installment = (price - deposit) / count;
                            return (
                              <Pressable key={pi} onPress={() => selectLaybyePlan(index, plan, price)} style={s.laybyPlanItem}>
                                <View style={{ flex: 1 }}>
                                  <Text style={s.laybyPlanName}>{plan.name || `${depPct}% Deposit Plan`}</Text>
                                  <Text style={s.laybyPlanDetail}>
                                    {formatPrice(deposit)} deposit + {count} × {formatPrice(installment)}
                                  </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={14} color={colors.gray400} />
                              </Pressable>
                            );
                          })}
                          {plans.length === 0 && (
                            <Text style={{ fontSize: 12, color: colors.gray400, padding: 8 }}>No laybye plans available</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Coupon */}
                <View style={s.discountSection}>
                  <Text style={s.discountSectionTitle}>Have a coupon?</Text>
                  {couponApplied ? (
                    <View style={s.appliedRow}>
                      <Ionicons name="pricetag" size={14} color={colors.green600} />
                      <Text style={s.appliedText}>{couponCode} applied — -{formatPrice(couponDiscount)}</Text>
                      <Pressable onPress={() => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(""); }}>
                        <Ionicons name="close-circle" size={16} color={colors.gray400} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={s.codeRow}>
                      <TextInput
                        style={s.codeInput}
                        value={couponCode}
                        onChangeText={setCouponCode}
                        placeholder="Enter coupon code"
                        placeholderTextColor={colors.gray400}
                        autoCapitalize="characters"
                      />
                      <Pressable onPress={applyCoupon} style={s.applyBtn}>
                        <Text style={s.applyBtnText}>Apply</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Gift Card */}
                <View style={s.discountSection}>
                  <View style={s.discountSectionHeader}>
                    <Text style={s.discountSectionTitle}>Gift Card</Text>
                    <Pressable onPress={() => { closeCheckoutDrawer(); setTimeout(() => router.push("/account/buy-gift-card" as any), 300); }}>
                      <Text style={s.buyGcLink}>Buy a Gift Card</Text>
                    </Pressable>
                  </View>
                  {cart.giftCardCode ? (
                    <View style={s.appliedRow}>
                      <Ionicons name="gift" size={14} color={colors.green600} />
                      <Text style={s.appliedText}>{cart.giftCardCode} — -{formatPrice(cart.giftCardAmount)}</Text>
                      <Pressable onPress={removeGiftCard}>
                        <Ionicons name="close-circle" size={16} color={colors.gray400} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={s.codeRow}>
                      <TextInput
                        style={s.codeInput}
                        value={giftCardInput}
                        onChangeText={setGiftCardInput}
                        placeholder="Enter gift card code"
                        placeholderTextColor={colors.gray400}
                        autoCapitalize="characters"
                      />
                      <Pressable onPress={applyGiftCard} disabled={giftCardLoading} style={s.applyBtn}>
                        {giftCardLoading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={s.applyBtnText}>Apply</Text>
                        }
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* PESA Coins */}
                {isAuthenticated && pesaEnabled && pesaBalance > 0 && (
                  <View style={s.discountSection}>
                    <View style={s.discountSectionHeader}>
                      <Text style={s.discountSectionTitle}>PESA Coins</Text>
                      <View style={s.coinsBadge}>
                        <Ionicons name="star" size={11} color="#d97706" />
                        <Text style={s.coinsBadgeText}>{pesaBalance} available</Text>
                      </View>
                    </View>
                    {pesaApplied ? (
                      <View style={s.appliedRow}>
                        <Ionicons name="star" size={14} color={colors.green600} />
                        <Text style={s.appliedText}>{pesaCoinsInput} coins applied — -{formatPrice(pesaDiscount)}</Text>
                        <Pressable onPress={removePesaCoins}>
                          <Ionicons name="close-circle" size={16} color={colors.gray400} />
                        </Pressable>
                      </View>
                    ) : (
                      <View>
                        <View style={s.codeRow}>
                          <TextInput
                            style={s.codeInput}
                            value={pesaCoinsInput}
                            onChangeText={setPesaCoinsInput}
                            placeholder={`Coins to use (max ${pesaBalance})`}
                            placeholderTextColor={colors.gray400}
                            keyboardType="number-pad"
                          />
                          <Pressable onPress={applyPesaCoins} disabled={pesaCalculating} style={s.applyBtn}>
                            {pesaCalculating
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={s.applyBtnText}>Apply</Text>
                            }
                          </Pressable>
                        </View>
                        <Pressable onPress={() => setPesaCoinsInput(String(pesaBalance))} style={{ marginTop: 4 }}>
                          <Text style={s.useAllCoins}>Use all {pesaBalance} coins</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {/* Order Summary */}
                <View style={s.summaryBox}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Subtotal</Text>
                    <Text style={s.summaryVal}>{formatPrice(subtotal)}</Text>
                  </View>
                  {couponDiscount > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Coupon</Text>
                      <Text style={[s.summaryVal, { color: colors.green600 }]}>-{formatPrice(couponDiscount)}</Text>
                    </View>
                  )}
                  {giftCardDiscount > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Gift Card</Text>
                      <Text style={[s.summaryVal, { color: colors.green600 }]}>-{formatPrice(giftCardDiscount)}</Text>
                    </View>
                  )}
                  {pesaDiscount > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>PESA Coins</Text>
                      <Text style={[s.summaryVal, { color: colors.green600 }]}>-{formatPrice(pesaDiscount)}</Text>
                    </View>
                  )}
                  {cart.getLaybyeItems().length > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Layby Deposits</Text>
                      <Text style={s.summaryVal}>{formatPrice(laybyeDepositTotal)}</Text>
                    </View>
                  )}
                  <View style={[s.summaryRow, s.summaryTotal]}>
                    <Text style={s.summaryTotalLabel}>Due Now</Text>
                    <Text style={s.summaryTotalVal}>{formatPrice(amountDueNow)}</Text>
                  </View>
                </View>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                STEP: DETAILS
            ════════════════════════════════════════════════════════════════ */}
            {!showAuthForm && step === "details" && (
              <>
                {/* Fulfilment */}
                <Text style={s.sectionLabel}>Fulfilment</Text>
                <View style={s.fulfilmentRow}>
                  {(["delivery", "pickup"] as const).map((f) => (
                    <Pressable key={f} onPress={() => setFulfilment(f)}
                      style={[s.fulfilmentOpt, fulfilment === f && s.fulfilmentOptActive]}>
                      <Ionicons name={f === "delivery" ? "car-outline" : "storefront-outline"} size={18}
                        color={fulfilment === f ? colors.primary : colors.gray500} />
                      <Text style={[s.fulfilmentText, fulfilment === f && { color: colors.primary }]}>
                        {f === "delivery" ? "Delivery" : "Pickup"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Contact */}
                <Text style={s.sectionLabel}>Contact</Text>
                <View style={s.formRow}>
                  <TextInput style={[s.input, { flex: 1 }, fieldErrors.firstName && s.inputError]}
                    value={formData.firstName} onChangeText={(v) => { setFormData((f) => ({ ...f, firstName: v })); if (v.trim()) setFieldErrors((e) => ({ ...e, firstName: false })); }}
                    placeholder="First Name *" placeholderTextColor={colors.gray400} />
                  <TextInput style={[s.input, { flex: 1 }]}
                    value={formData.lastName} onChangeText={(v) => setFormData((f) => ({ ...f, lastName: v }))}
                    placeholder="Last Name" placeholderTextColor={colors.gray400} />
                </View>
                <TextInput style={[s.input, fieldErrors.email && s.inputError]}
                  value={formData.email} onChangeText={(v) => { setFormData((f) => ({ ...f, email: v })); if (v.trim()) setFieldErrors((e) => ({ ...e, email: false })); }}
                  placeholder="Email *" placeholderTextColor={colors.gray400} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={[s.input, fieldErrors.phone && s.inputError]}
                  value={formData.phone} onChangeText={(v) => { setFormData((f) => ({ ...f, phone: v })); if (v.trim()) setFieldErrors((e) => ({ ...e, phone: false })); }}
                  placeholder="Phone *" placeholderTextColor={colors.gray400} keyboardType="phone-pad" />

                {/* Address or Pickup */}
                {fulfilment === "delivery" ? (
                  <>
                    <Text style={s.sectionLabel}>Delivery Address</Text>
                    <TextInput style={[s.input, fieldErrors.address && s.inputError]}
                      value={formData.address} onChangeText={(v) => { setFormData((f) => ({ ...f, address: v })); if (v.trim()) setFieldErrors((e) => ({ ...e, address: false })); }}
                      placeholder="Street Address *" placeholderTextColor={colors.gray400} />
                    <View style={s.formRow}>
                      <TextInput style={[s.input, { flex: 1 }, fieldErrors.city && s.inputError]}
                        value={formData.city} onChangeText={(v) => { setFormData((f) => ({ ...f, city: v })); if (v.trim()) setFieldErrors((e) => ({ ...e, city: false })); }}
                        placeholder="City *" placeholderTextColor={colors.gray400} />
                      <TextInput style={[s.input, { flex: 1 }]}
                        value={formData.province} onChangeText={(v) => setFormData((f) => ({ ...f, province: v }))}
                        placeholder="Province" placeholderTextColor={colors.gray400} />
                    </View>
                    <TextInput style={s.input}
                      value={formData.postalCode} onChangeText={(v) => setFormData((f) => ({ ...f, postalCode: v }))}
                      placeholder="Postal Code" placeholderTextColor={colors.gray400} keyboardType="number-pad" />
                  </>
                ) : (
                  <>
                    <Text style={s.sectionLabel}>Pickup Location</Text>
                    {pickupAddresses.length > 0 ? pickupAddresses.map((p: any) => {
                      const active = selectedPickup === p.label;
                      return (
                        <Pressable key={p.label} onPress={() => setSelectedPickup(p.label)}
                          style={[s.pickupItem, active && s.pickupItemActive]}>
                          <View style={s.paymentRadio}>{active && <View style={s.paymentRadioInner} />}</View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.pickupLabel, active && { color: colors.primary }]}>{p.label}</Text>
                            <Text style={s.pickupAddr}>{p.address}</Text>
                          </View>
                        </Pressable>
                      );
                    }) : (
                      <Text style={{ fontSize: 13, color: colors.gray400, paddingVertical: 8 }}>No pickup locations available</Text>
                    )}
                  </>
                )}

                {/* Payment Methods */}
                <Text style={s.sectionLabel}>Payment Method</Text>

                {/* Split Payment Toggle */}
                <Pressable onPress={() => setSplitPayment((v) => !v)} style={s.splitToggleRow}>
                  <View style={[s.splitToggle, splitPayment && s.splitToggleActive]}>
                    {splitPayment && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={s.splitToggleText}>Split payment across multiple methods</Text>
                </Pressable>

                {paymentMethods.length > 0 ? paymentMethods.map((pm) => {
                  const id = pmId(pm);
                  const active = !splitPayment && paymentMethod === id;
                  return (
                    <View key={id}>
                      <Pressable
                        onPress={() => !splitPayment && setPaymentMethod(id)}
                        style={[s.paymentOpt, active && s.paymentOptActive]}
                      >
                        <Text style={s.paymentIcon}>{pmIcon(pm)}</Text>
                        <Text style={[s.paymentLabel, active && { color: colors.primary }]}>{pmLabel(pm)}</Text>
                        {!splitPayment ? (
                          <View style={s.paymentRadio}>{active && <View style={s.paymentRadioInner} />}</View>
                        ) : (
                          <TextInput
                            style={s.splitAmountInput}
                            value={splitAmounts[id] || ""}
                            onChangeText={(v) => setSplitAmounts((a) => ({ ...a, [id]: v }))}
                            placeholder="0.00"
                            placeholderTextColor={colors.gray400}
                            keyboardType="decimal-pad"
                          />
                        )}
                      </Pressable>
                    </View>
                  );
                }) : (
                  // Fallback hardcoded methods if API fails
                  [
                    { id: "eft", name: "EFT / Bank Transfer", emoji: "🏦" },
                    { id: "cash", name: "Cash on Delivery", emoji: "💵" },
                    { id: "card", name: "Card", emoji: "💳" },
                  ].map((pm) => {
                    const active = !splitPayment && paymentMethod === pm.id;
                    return (
                      <Pressable key={pm.id} onPress={() => !splitPayment && setPaymentMethod(pm.id)}
                        style={[s.paymentOpt, active && s.paymentOptActive]}>
                        <Text style={s.paymentIcon}>{pm.emoji}</Text>
                        <Text style={[s.paymentLabel, active && { color: colors.primary }]}>{pm.name}</Text>
                        <View style={s.paymentRadio}>{active && <View style={s.paymentRadioInner} />}</View>
                      </Pressable>
                    );
                  })
                )}

                {splitPayment && (
                  <View style={s.splitSummary}>
                    <Text style={[s.splitSummaryText, !splitValid && { color: colors.red500 }]}>
                      Total entered: {formatPrice(splitTotal)} / Due: {formatPrice(amountDueNow)}
                      {splitValid ? " ✓" : " (amounts must match)"}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                <TextInput style={[s.input, { height: 70, textAlignVertical: "top", marginTop: 8 }]}
                  value={formData.notes} onChangeText={(v) => setFormData((f) => ({ ...f, notes: v }))}
                  placeholder="Order notes (optional)" placeholderTextColor={colors.gray400} multiline />
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                STEP: CONFIRMATION
            ════════════════════════════════════════════════════════════════ */}
            {!showAuthForm && step === "confirmation" && (
              <View style={s.confirmWrap}>
                <Text style={s.confirmTitle}>Order Summary</Text>
                {cart.items.map((item, i) => (
                  <View key={i} style={s.confirmItem}>
                    <Text style={s.confirmItemName} numberOfLines={1}>
                      {item.product.name} × {item.quantity}
                      {item.laybye ? " (Laybye)" : ""}
                    </Text>
                    <Text style={s.confirmItemPrice}>
                      {item.laybye ? formatPrice(item.laybye.deposit) + " dep." : formatPrice((item.product.salePrice || item.product.regularPrice) * item.quantity)}
                    </Text>
                  </View>
                ))}
                <View style={s.confirmDivider} />
                {couponDiscount > 0 && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Coupon ({couponCode})</Text>
                    <Text style={[s.confirmDetailVal, { color: colors.green600 }]}>-{formatPrice(couponDiscount)}</Text>
                  </View>
                )}
                {giftCardDiscount > 0 && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Gift Card</Text>
                    <Text style={[s.confirmDetailVal, { color: colors.green600 }]}>-{formatPrice(giftCardDiscount)}</Text>
                  </View>
                )}
                {pesaDiscount > 0 && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>PESA Coins</Text>
                    <Text style={[s.confirmDetailVal, { color: colors.green600 }]}>-{formatPrice(pesaDiscount)}</Text>
                  </View>
                )}
                <View style={s.confirmItem}>
                  <Text style={s.confirmTotalLabel}>Total Due Now</Text>
                  <Text style={s.confirmTotalVal}>{formatPrice(amountDueNow)}</Text>
                </View>
                <View style={s.confirmDivider} />
                <View style={s.confirmItem}>
                  <Text style={s.confirmDetailLabel}>Fulfilment</Text>
                  <Text style={s.confirmDetailVal}>{fulfilment === "delivery" ? "Delivery" : "Pickup"}</Text>
                </View>
                <View style={s.confirmItem}>
                  <Text style={s.confirmDetailLabel}>Payment</Text>
                  <Text style={s.confirmDetailVal}>
                    {splitPayment ? "Split payment" : (paymentMethods.find((p) => pmId(p) === paymentMethod)?.name || paymentMethod)}
                  </Text>
                </View>
                {fulfilment === "pickup" && selectedPickup && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Pickup at</Text>
                    <Text style={s.confirmDetailVal} numberOfLines={2}>{selectedPickup}</Text>
                  </View>
                )}
                {fulfilment === "delivery" && formData.address && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Ship to</Text>
                    <Text style={s.confirmDetailVal} numberOfLines={2}>{formData.address}, {formData.city}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* ── Footer buttons ─────────────────────────────────────────────── */}
          <View style={s.footer}>
            {showAuthForm && (
              <Pressable onPress={() => setShowAuthForm(false)} style={s.secondaryBtn}>
                <Text style={s.secondaryBtnText}>← Back to Cart</Text>
              </Pressable>
            )}

            {!showAuthForm && step === "cart" && (
              <Pressable
                onPress={() => {
                  if (cart.items.length === 0) {
                    Toast.show({ type: "error", text1: "Your cart is empty" });
                    return;
                  }
                  if (!isAuthenticated) {
                    Toast.show({ type: "info", text1: "Sign in to continue", text2: "Or continue as a guest" });
                    setShowAuthForm(true);
                    return;
                  }
                  setFieldErrors({});
                  setStep("details");
                }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>Continue</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </Pressable>
            )}

            {!showAuthForm && step === "details" && (
              <View style={s.footerRow}>
                <Pressable onPress={() => setStep("cart")} style={s.secondaryBtn}>
                  <Text style={s.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable onPress={() => { if (validateDetails()) setStep("confirmation"); }} style={[s.primaryBtn, { flex: 1 }]}>
                  <Text style={s.primaryBtnText}>Review Order</Text>
                </Pressable>
              </View>
            )}

            {!showAuthForm && step === "confirmation" && (
              <View style={s.footerRow}>
                <Pressable onPress={() => setStep("details")} style={s.secondaryBtn}>
                  <Text style={s.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handlePlaceOrder}
                  disabled={submitting}
                  style={[s.primaryBtn, { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, submitting && { opacity: 0.6 }]}
                >
                  <Text style={s.primaryBtnText}>{submitting ? "Placing Order..." : "Place Order"}</Text>
                  {!submitting && <PulsingArrows color="#fff" size={16} count={3} />}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 50,
  },
  drawer: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    zIndex: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stepDot: { width: 28, height: 4, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  // Auth form
  authWrap: { paddingTop: 8, paddingBottom: 16 },
  authSubtitle: { fontSize: 13, color: colors.gray600, marginBottom: 16, lineHeight: 18 },
  authModeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  authModeBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderWidth: 1, borderColor: colors.gray200 },
  authModeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  authModeBtnText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  guestBtn: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  guestBtnText: { fontSize: 13, color: colors.gray500, textDecorationLine: "underline" },

  // Free shipping
  freeShipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + "40",
    padding: 10,
    marginBottom: 12,
  },
  freeShipText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: "500" },

  // Cart items
  cartItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  cartItemImg: { width: 56, height: 56, backgroundColor: colors.gray100 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: "500", color: colors.gray800 },
  laybyRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  laybyText: { fontSize: 10, color: colors.amber500, fontWeight: "600", flex: 1 },
  laybyRemove: { padding: 2 },
  cartItemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cartItemPrice: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  cartItemQty: { fontSize: 11, color: colors.gray500 },
  laybyeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    alignSelf: "flex-start",
  },
  laybyeChipText: { fontSize: 10, fontWeight: "600", color: "#d97706" },

  // Laybye plan picker
  laybyPicker: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 4,
    padding: 10,
  },
  laybyPickerTitle: { fontSize: 11, fontWeight: "700", color: "#92400e", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  laybyPlanItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  laybyPlanName: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  laybyPlanDetail: { fontSize: 11, color: colors.gray500, marginTop: 2 },

  // Discount sections
  discountSection: {
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
    marginTop: 10,
  },
  discountSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  discountSectionTitle: { fontSize: 12, fontWeight: "700", color: colors.gray700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  buyGcLink: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  codeRow: { flexDirection: "row", gap: 8 },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.gray800,
  },
  applyBtn: { backgroundColor: colors.gray800, paddingHorizontal: 16, justifyContent: "center", minWidth: 60, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  appliedRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", padding: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  appliedText: { flex: 1, fontSize: 12, color: colors.green600, fontWeight: "600" },
  coinsBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#fffbeb", paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#fde68a" },
  coinsBadgeText: { fontSize: 11, color: "#d97706", fontWeight: "600" },
  useAllCoins: { fontSize: 11, color: colors.primary, textDecorationLine: "underline" },

  // Summary
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: colors.gray600 },
  summaryVal: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  summaryTotalVal: { fontSize: 15, fontWeight: "700", color: colors.primary },

  // Details step
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.gray800, marginTop: 16, marginBottom: 8 },
  formRow: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.gray800,
    marginBottom: 8,
  },
  inputError: { borderColor: colors.red500, borderWidth: 1.5 },
  fulfilmentRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  fulfilmentOpt: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderWidth: 1, borderColor: colors.gray200,
  },
  fulfilmentOptActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  fulfilmentText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  pickupItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.gray200, marginBottom: 6,
  },
  pickupItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pickupLabel: { fontSize: 14, fontWeight: "600", color: colors.gray800 },
  pickupAddr: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  paymentOpt: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.gray200, marginBottom: 6,
  },
  paymentOptActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paymentIcon: { fontSize: 18 },
  paymentLabel: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.gray700 },
  paymentRadio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.gray300,
    alignItems: "center", justifyContent: "center",
  },
  paymentRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  // Split payment
  splitToggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  splitToggle: { width: 20, height: 20, borderRadius: 2, borderWidth: 2, borderColor: colors.gray300, alignItems: "center", justifyContent: "center" },
  splitToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  splitToggleText: { fontSize: 13, color: colors.gray700 },
  splitAmountInput: {
    borderWidth: 1, borderColor: colors.gray200,
    paddingHorizontal: 8, paddingVertical: 4,
    fontSize: 13, color: colors.gray800, width: 80, textAlign: "right",
  },
  splitSummary: { padding: 8, backgroundColor: colors.gray50, marginBottom: 8 },
  splitSummaryText: { fontSize: 12, color: colors.gray600 },

  // Confirmation
  confirmWrap: { paddingTop: 4 },
  confirmTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  confirmItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  confirmItemName: { flex: 1, fontSize: 13, color: colors.gray700 },
  confirmItemPrice: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  confirmDivider: { height: 1, backgroundColor: colors.gray200, marginVertical: 8 },
  confirmTotalLabel: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  confirmTotalVal: { fontSize: 15, fontWeight: "700", color: colors.primary },
  confirmDetailLabel: { fontSize: 12, color: colors.gray500 },
  confirmDetailVal: { fontSize: 12, fontWeight: "500", color: colors.gray700, maxWidth: "60%", textAlign: "right" },

  // Footer
  footer: { borderTopWidth: 1, borderTopColor: colors.gray100, padding: 16, paddingBottom: 34 },
  footerRow: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 13,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1, borderColor: colors.gray200,
    paddingHorizontal: 16, paddingVertical: 13,
    alignItems: "center", justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.gray700 },
});
