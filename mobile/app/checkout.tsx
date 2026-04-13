import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import ScreenHeader from "@/components/ScreenHeader";
import OfferSlot from "@/components/OfferSlot";
import {
  ordersAPI,
  productPageSettingsAPI,
  giftCardsAPI,
  couponsAPI,
  loyaltyAPI,
} from "@/services/api";
import { useCartStore, useAuthStore, useCurrencyStore } from "@/store";
import { colors } from "@/theme";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [pickupAddresses, setPickupAddresses] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("eft");

  // Discounts
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardApplied, setGiftCardApplied] = useState<{ code: string; amount: number } | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; type: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);

  const [form, setForm] = useState({
    firstName: user?.firstName || (user?.name?.split(" ")[0] || ""),
    lastName: user?.lastName || (user?.name?.split(" ").slice(1).join(" ") || ""),
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    postalCode: "",
    country: "South Africa",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    productPageSettingsAPI.get().then((res) => {
      const settings = res.data?.data || res.data;
      const pickups = settings?.checkoutDrawer?.pickupAddresses?.filter((p: any) => p.enabled) || [];
      setPickupAddresses(pickups);
      if (pickups.length > 0) setSelectedPickup(pickups[0].label);
    }).catch(() => {});

    if (isAuthenticated) {
      loyaltyAPI.getMyOverview().then((res) => {
        const data = res.data?.data || res.data;
        setLoyaltyBalance(data?.balance || data?.points || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (value.trim()) setFieldErrors((prev) => ({ ...prev, [key]: false }));
  };

  // ─── Gift Card ───
  const applyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    try {
      const res = await giftCardsAPI.validate(giftCardCode.trim());
      const data = res.data?.data || res.data;
      const amount = data?.balance || data?.amount || 0;
      setGiftCardApplied({ code: giftCardCode.trim(), amount });
      Toast.show({ type: "success", text1: `Gift card applied: ${formatPrice(amount)}` });
    } catch {
      Toast.show({ type: "error", text1: "Invalid gift card code" });
    } finally {
      setGiftCardLoading(false);
    }
  };

  const removeGiftCard = () => {
    setGiftCardApplied(null);
    setGiftCardCode("");
  };

  // ─── Coupon ───
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const subtotal = getTotal();
      const res = await couponsAPI.publicValidate(couponCode.trim(), subtotal);
      const data = res.data?.data || res.data;
      const discount = data?.discountAmount || data?.discount || 0;
      setCouponApplied({ code: couponCode.trim(), discount, type: data?.discountType || "fixed" });
      Toast.show({ type: "success", text1: `Coupon applied: ${formatPrice(discount)} off` });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Invalid coupon code" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
  };

  // ─── Loyalty ───
  const toggleLoyalty = async () => {
    if (loyaltyApplied) {
      setLoyaltyApplied(false);
      setLoyaltyDiscount(0);
      setLoyaltyPointsUsed(0);
      return;
    }
    try {
      const res = await loyaltyAPI.calculateRedemption(loyaltyBalance);
      const data = res.data?.data || res.data;
      const discount = data?.discountAmount || data?.value || 0;
      const points = data?.pointsUsed || loyaltyBalance;
      setLoyaltyDiscount(discount);
      setLoyaltyPointsUsed(points);
      setLoyaltyApplied(true);
      Toast.show({ type: "success", text1: `${points} PESA Coins applied: ${formatPrice(discount)} off` });
    } catch {
      Toast.show({ type: "error", text1: "Could not apply loyalty points" });
    }
  };

  // ─── Totals ───
  const subtotal = getTotal();
  const giftCardDiscount = giftCardApplied?.amount || 0;
  const couponDiscount = couponApplied?.discount || 0;
  const loyaltyDiscountAmt = loyaltyApplied ? loyaltyDiscount : 0;
  const orderTotal = Math.max(0, subtotal - giftCardDiscount - couponDiscount - loyaltyDiscountAmt);

  // ─── Place Order ───
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      Toast.show({ type: "error", text1: "Please sign in to place an order" });
      router.push("/auth/login" as any);
      return;
    }
    const errors: Record<string, boolean> = {};
    if (!form.firstName.trim()) errors.firstName = true;
    if (!form.email.trim()) errors.email = true;
    if (!form.phone.trim()) errors.phone = true;
    if (deliveryMethod === "delivery" && !form.address.trim()) errors.address = true;
    if (deliveryMethod === "delivery" && !form.city.trim()) errors.city = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      Toast.show({ type: "error", text1: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");
      const orderData: any = {
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.regularPrice,
          variant: item.variant,
          laybye: item.laybye,
        })),
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          name: fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        deliveryMethod,
        paymentMethod,
        notes: form.notes,
        subtotal,
        total: orderTotal,
        ...(giftCardApplied && { giftCardCode: giftCardApplied.code, giftCardAmount: giftCardDiscount }),
        ...(couponApplied && { couponCode: couponApplied.code, couponDiscount }),
        ...(loyaltyApplied && { loyaltyPointsUsed, loyaltyDiscount: loyaltyDiscountAmt }),
      };

      if (deliveryMethod === "pickup" && selectedPickup) {
        const pickup = pickupAddresses.find((p) => p.label === selectedPickup);
        orderData.pickupAddress = pickup ? { label: pickup.label, address: pickup.address } : undefined;
      }

      const res = await ordersAPI.create(orderData);
      const order = res.data?.data || res.data;
      clearCart();
      Toast.show({ type: "success", text1: "Order placed successfully!" });
      router.replace(`/order/${order._id || order.orderNumber}` as any);
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to place order" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={co.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader title="Checkout" showBack />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Contact Information */}
        <View style={co.section}>
          <Text style={co.sectionTitle}>Contact Information</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TextInput style={[co.textInput, { flex: 1 }, fieldErrors.firstName && co.inputError]} placeholder="First Name *" placeholderTextColor={colors.gray400} value={form.firstName} onChangeText={(v) => updateForm("firstName", v)} />
            <TextInput style={[co.textInput, { flex: 1 }]} placeholder="Last Name" placeholderTextColor={colors.gray400} value={form.lastName} onChangeText={(v) => updateForm("lastName", v)} />
          </View>
          <TextInput style={[co.textInput, fieldErrors.email && co.inputError]} placeholder="Email *" placeholderTextColor={colors.gray400} value={form.email} onChangeText={(v) => updateForm("email", v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[co.textInput, { marginBottom: 0 }, fieldErrors.phone && co.inputError]} placeholder="Phone *" placeholderTextColor={colors.gray400} value={form.phone} onChangeText={(v) => updateForm("phone", v)} keyboardType="phone-pad" />
        </View>

        {/* Delivery Method */}
        <View style={co.section}>
          <Text style={co.sectionTitle}>Delivery Method</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => setDeliveryMethod("delivery")} style={[co.methodBtn, deliveryMethod === "delivery" ? co.methodActive : co.methodInactive]}>
              <Ionicons name="car-outline" size={20} color={deliveryMethod === "delivery" ? colors.primary : colors.gray400} />
              <Text style={[co.methodLabel, { color: deliveryMethod === "delivery" ? colors.primary : colors.gray500 }]}>Delivery</Text>
            </Pressable>
            {pickupAddresses.length > 0 && (
              <Pressable onPress={() => setDeliveryMethod("pickup")} style={[co.methodBtn, deliveryMethod === "pickup" ? co.methodActive : co.methodInactive]}>
                <Ionicons name="storefront-outline" size={20} color={deliveryMethod === "pickup" ? colors.primary : colors.gray400} />
                <Text style={[co.methodLabel, { color: deliveryMethod === "pickup" ? colors.primary : colors.gray500 }]}>Pickup</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Delivery Address / Pickup */}
        {deliveryMethod === "delivery" ? (
          <View style={co.section}>
            <Text style={co.sectionTitle}>Delivery Address</Text>
            <TextInput style={[co.textInput, fieldErrors.address && co.inputError]} placeholder="Street Address *" placeholderTextColor={colors.gray400} value={form.address} onChangeText={(v) => updateForm("address", v)} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[co.textInput, { flex: 1, marginBottom: 0 }, fieldErrors.city && co.inputError]} placeholder="City *" placeholderTextColor={colors.gray400} value={form.city} onChangeText={(v) => updateForm("city", v)} />
              <TextInput style={[co.textInput, { flex: 1, marginBottom: 0 }]} placeholder="Postal Code" placeholderTextColor={colors.gray400} value={form.postalCode} onChangeText={(v) => updateForm("postalCode", v)} keyboardType="number-pad" />
            </View>
          </View>
        ) : (
          <View style={co.section}>
            <Text style={co.sectionTitle}>Pickup Location</Text>
            {pickupAddresses.map((p: any) => {
              const active = selectedPickup === p.label;
              return (
                <Pressable key={p.label} onPress={() => setSelectedPickup(p.label)} style={[co.pickupItem, active ? co.methodActive : co.methodInactive]}>
                  <Text style={[co.pickupLabel, { color: active ? colors.primary : colors.gray800 }]}>{p.label}</Text>
                  <Text style={co.pickupAddr}>{p.address}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Payment Method */}
        <View style={co.section}>
          <Text style={co.sectionTitle}>Payment Method</Text>
          {[
            { id: "eft",  label: "EFT / Bank Transfer",  icon: "card-outline" },
            { id: "cash", label: "Cash on Delivery",      icon: "cash-outline" },
          ].map((method) => {
            const active = paymentMethod === method.id;
            return (
              <Pressable key={method.id} onPress={() => setPaymentMethod(method.id)} style={[co.paymentItem, active ? co.methodActive : co.methodInactive]}>
                <Ionicons name={method.icon as any} size={18} color={active ? colors.primary : colors.gray400} />
                <Text style={[co.paymentLabel, { color: active ? colors.primary : colors.gray700 }]}>{method.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Discounts */}
        <View style={co.section}>
          <Text style={co.sectionTitle}>Discounts & Offers</Text>

          {/* Gift Card */}
          {giftCardApplied ? (
            <View style={co.discountApplied}>
              <Ionicons name="gift-outline" size={16} color="#16a34a" />
              <Text style={co.discountAppliedText}>Gift Card: -{formatPrice(giftCardApplied.amount)}</Text>
              <Pressable onPress={removeGiftCard} style={co.removeBtn}>
                <Ionicons name="close-circle" size={18} color={colors.gray400} />
              </Pressable>
            </View>
          ) : (
            <View style={co.discountRow}>
              <TextInput style={[co.discountInput]} placeholder="Gift Card Code" placeholderTextColor={colors.gray400} value={giftCardCode} onChangeText={setGiftCardCode} autoCapitalize="characters" />
              <Pressable onPress={applyGiftCard} disabled={giftCardLoading} style={co.discountApplyBtn}>
                {giftCardLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={co.discountApplyText}>Apply</Text>}
              </Pressable>
            </View>
          )}

          {/* Coupon */}
          {couponApplied ? (
            <View style={[co.discountApplied, { marginTop: 8 }]}>
              <Ionicons name="pricetag-outline" size={16} color="#16a34a" />
              <Text style={co.discountAppliedText}>Coupon: -{formatPrice(couponApplied.discount)}</Text>
              <Pressable onPress={removeCoupon} style={co.removeBtn}>
                <Ionicons name="close-circle" size={18} color={colors.gray400} />
              </Pressable>
            </View>
          ) : (
            <View style={[co.discountRow, { marginTop: 8 }]}>
              <TextInput style={co.discountInput} placeholder="Coupon Code" placeholderTextColor={colors.gray400} value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
              <Pressable onPress={applyCoupon} disabled={couponLoading} style={co.discountApplyBtn}>
                {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={co.discountApplyText}>Apply</Text>}
              </Pressable>
            </View>
          )}

          {/* Loyalty Points */}
          {isAuthenticated && loyaltyBalance > 0 && (
            <View style={[co.discountRow, { marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.gray700, fontWeight: "600" }}>
                  PESA Coins: <Text style={{ color: colors.primary }}>{loyaltyBalance} pts</Text>
                </Text>
                {loyaltyApplied && <Text style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>Applied: -{formatPrice(loyaltyDiscount)}</Text>}
              </View>
              <Pressable onPress={toggleLoyalty} style={[co.discountApplyBtn, loyaltyApplied && { backgroundColor: colors.gray400 }]}>
                <Text style={co.discountApplyText}>{loyaltyApplied ? "Remove" : "Redeem"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Order Notes */}
        <View style={co.section}>
          <Text style={co.sectionTitle}>Order Notes (optional)</Text>
          <TextInput style={co.notesInput} placeholder="Any special instructions..." placeholderTextColor={colors.gray400} value={form.notes} onChangeText={(v) => updateForm("notes", v)} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* Order Summary */}
        <View style={[co.section, { marginBottom: 16 }]}>
          <Text style={co.sectionTitle}>Order Summary</Text>
          {items.map((item, i) => (
            <View key={i} style={co.summaryRow}>
              <Text style={co.summaryName} numberOfLines={1}>{item.product.name} × {item.quantity}</Text>
              <Text style={co.summaryPrice}>{formatPrice((item.product.salePrice || item.product.regularPrice) * item.quantity * ((item.recurring?.paymentMode === 'upfront' && item.recurring?.instances) ? item.recurring.instances : 1))}</Text>
            </View>
          ))}
          <View style={co.divider} />
          <View style={co.summaryRow}>
            <Text style={co.subtotalLabel}>Subtotal</Text>
            <Text style={co.summaryPrice}>{formatPrice(subtotal)}</Text>
          </View>
          {giftCardApplied && (
            <View style={co.summaryRow}>
              <Text style={[co.subtotalLabel, { color: "#16a34a" }]}>Gift Card</Text>
              <Text style={[co.summaryPrice, { color: "#16a34a" }]}>-{formatPrice(giftCardDiscount)}</Text>
            </View>
          )}
          {couponApplied && (
            <View style={co.summaryRow}>
              <Text style={[co.subtotalLabel, { color: "#16a34a" }]}>Coupon ({couponApplied.code})</Text>
              <Text style={[co.summaryPrice, { color: "#16a34a" }]}>-{formatPrice(couponDiscount)}</Text>
            </View>
          )}
          {loyaltyApplied && (
            <View style={co.summaryRow}>
              <Text style={[co.subtotalLabel, { color: "#16a34a" }]}>PESA Coins</Text>
              <Text style={[co.summaryPrice, { color: "#16a34a" }]}>-{formatPrice(loyaltyDiscountAmt)}</Text>
            </View>
          )}
          <View style={co.totalRow}>
            <Text style={co.totalLabel}>Total</Text>
            <Text style={co.totalValue}>{formatPrice(orderTotal)}</Text>
          </View>
        </View>

        <OfferSlot page="checkout" />
        <View style={{ height: 128 }} />
      </ScrollView>

      <View style={[co.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={handlePlaceOrder} disabled={loading} style={[co.placeBtn, loading && { opacity: 0.7 }]}>
          <Text style={co.placeBtnText}>{loading ? "Placing Order..." : `Place Order • ${formatPrice(orderTotal)}`}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const co = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  section: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  textInput: { backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, height: 44, marginBottom: 12, fontSize: 14, color: colors.gray800, borderWidth: 1, borderColor: colors.gray200 },
  methodBtn: { flex: 1, paddingVertical: 12, borderRadius: 0, borderWidth: 1, alignItems: "center" },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodInactive: { borderColor: colors.gray200, backgroundColor: colors.white },
  methodLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  pickupItem: { padding: 12, borderRadius: 0, borderWidth: 1, marginBottom: 8 },
  pickupLabel: { fontSize: 14, fontWeight: "600" },
  pickupAddr: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  paymentItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 0, borderWidth: 1, marginBottom: 8 },
  paymentLabel: { marginLeft: 12, fontSize: 14, fontWeight: "500" },
  // Discounts
  discountRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  discountInput: { flex: 1, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 40, fontSize: 13, color: colors.gray800 },
  discountApplyBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, height: 40, alignItems: "center", justifyContent: "center" },
  discountApplyText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  discountApplied: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 4, padding: 10, gap: 8 },
  discountAppliedText: { flex: 1, fontSize: 13, color: "#16a34a", fontWeight: "600" },
  removeBtn: { padding: 2 },
  // Notes
  notesInput: { backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: colors.gray800, borderWidth: 1, borderColor: colors.gray200 },
  // Summary
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryName: { fontSize: 12, color: colors.gray600, flex: 1 },
  summaryPrice: { fontSize: 12, fontWeight: "600", color: colors.gray800 },
  subtotalLabel: { fontSize: 12, color: colors.gray600 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 8, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  totalValue: { fontSize: 14, fontWeight: "700", color: colors.primary },
  // Bottom bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, paddingHorizontal: 16, paddingTop: 12 },
  placeBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center" },
  placeBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  inputError: { borderColor: colors.red500, borderWidth: 1.5 },
});
