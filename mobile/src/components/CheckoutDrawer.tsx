import { useRef, useEffect, useState, useMemo } from "react";
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
import { ordersAPI, couponsAPI, laybyPlansAPI, productPageSettingsAPI } from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";
import PulsingArrows from "@/components/PulsingArrows";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PAYMENT_METHODS = [
  { id: "eft", label: "EFT / Bank Transfer", icon: "🏦" },
  { id: "ecocash", label: "EcoCash", icon: "📱" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "card", label: "Card", icon: "💳" },
];

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
  const { user, isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<"cart" | "details" | "confirmation">("cart");
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState("eft");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Fetch pickup addresses
  useEffect(() => {
    if (checkoutDrawerOpen) {
      productPageSettingsAPI.get().then((res) => {
        const settings = res.data?.data || res.data;
        const pickups = settings?.checkoutDrawer?.pickupAddresses?.filter((p: any) => p.enabled) || [];
        setPickupAddresses(pickups);
        if (pickups.length > 0 && !selectedPickup) setSelectedPickup(pickups[0].label);
      }).catch(() => {});
    }
  }, [checkoutDrawerOpen]);

  // Populate form with user data
  useEffect(() => {
    if (checkoutDrawerOpen && user) {
      const names = (user.name || "").split(" ");
      const addr = user.addresses?.[0] || {};
      setFormData((f) => ({
        ...f,
        firstName: names[0] || f.firstName,
        lastName: names.slice(1).join(" ") || f.lastName,
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
      cart.addItem(
        checkoutDrawerProduct,
        checkoutDrawerQuantity || 1,
        checkoutDrawerVariant || null,
        isLaybye
      );
      if (checkoutDrawerLaybye) {
        // Find the laybye entry we just added/incremented
        const idx = useCartStore
          .getState()
          .items.findIndex(
            (i) =>
              i.product._id === checkoutDrawerProduct._id &&
              !!i.laybye === isLaybye
          );
        if (idx >= 0) cart.setItemLaybye(idx, checkoutDrawerLaybye);
      }
    }
  }, [checkoutDrawerOpen, checkoutDrawerProduct]);

  useEffect(() => {
    if (checkoutDrawerOpen) {
      setStep("cart");
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [checkoutDrawerOpen]);

  const subtotal = cart.getTotal();
  const totalAfterCoupon = Math.max(0, subtotal - couponDiscount);
  const cashItems = cart.getCashItems();
  const laybyeItems = cart.getLaybyeItems();
  const cashTotal = cart.getCashTotal();
  const laybyeDepositTotal = cart.getLaybyeDepositTotal();
  const amountDueNow = Math.max(0, cashTotal + laybyeDepositTotal - couponDiscount);

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
    return true;
  };

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

  const handlePlaceOrder = async () => {
    if (!formData.firstName || !formData.email || !formData.phone) {
      Toast.show({ type: "error", text1: "Please fill in required fields" });
      return;
    }
    if (fulfilment === "delivery" && !formData.address) {
      Toast.show({ type: "error", text1: "Please enter delivery address" });
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.regularPrice,
          variant: item.variant?._id || null,
          laybye: item.laybye
            ? {
                planId: item.laybye.plan?._id,
                deposit: item.laybye.deposit,
                installmentAmount: item.laybye.installment,
              }
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
        paymentMethod,
        couponCode: couponApplied ? couponCode : undefined,
        notes: formData.notes,
        pickupAddress: fulfilment === "pickup" && selectedPickup
          ? (() => {
              const p = pickupAddresses.find((a: any) => a.label === selectedPickup);
              return p ? { label: p.label, address: p.address } : undefined;
            })()
          : undefined,
      };

      const res = await ordersAPI.create(orderData);
      const orderId = res.data?.data?._id || res.data?.order?._id;
      cart.clearCart();
      closeCheckoutDrawer();
      Toast.show({
        type: "success",
        text1: "Order placed successfully!",
        text2: "Thank you for your purchase",
      });
      if (orderId) {
        router.push(`/order/${orderId}` as any);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to place order",
        text2: err?.response?.data?.message || "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkoutDrawerOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeCheckoutDrawer} />
      </Animated.View>

      <Animated.View
        style={[s.drawer, { transform: [{ translateY: slideAnim }] }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>
              {step === "cart"
                ? "Checkout"
                : step === "details"
                ? "Your Details"
                : "Confirmation"}
            </Text>
            <Pressable onPress={closeCheckoutDrawer} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>

          {/* Steps indicator */}
          <View style={s.stepsRow}>
            {["cart", "details", "confirmation"].map((s2, i) => (
              <View
                key={s2}
                style={[
                  s.stepDot,
                  {
                    backgroundColor:
                      step === s2
                        ? colors.primary
                        : i <
                          ["cart", "details", "confirmation"].indexOf(step)
                        ? colors.primary
                        : colors.gray200,
                  },
                ]}
              />
            ))}
          </View>

          <ScrollView
            style={s.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP: CART */}
            {step === "cart" && (
              <>
                {cart.items.map((item, index) => {
                  const imgUrl =
                    resolveImageUrl(item.product.images?.[0]) ||
                    resolveImageUrl(item.product.image);
                  const price =
                    item.product.salePrice || item.product.regularPrice;

                  return (
                    <View key={`${item.product._id}-${index}`} style={s.cartItem}>
                      <Image
                        source={{ uri: imgUrl }}
                        style={s.cartItemImg}
                        contentFit="cover"
                      />
                      <View style={s.cartItemInfo}>
                        <Text style={s.cartItemName} numberOfLines={2}>
                          {item.product.name}
                        </Text>
                        {item.laybye && (
                          <View style={s.laybyRow}>
                            <Ionicons name="time-outline" size={10} color={colors.amber500} />
                            <Text style={s.laybyText}>
                              Layby: {formatPrice(item.laybye.deposit)} deposit
                            </Text>
                          </View>
                        )}
                        <View style={s.cartItemBottom}>
                          <Text style={s.cartItemPrice}>
                            {formatPrice(price * item.quantity)}
                          </Text>
                          <Text style={s.cartItemQty}>Qty: {item.quantity}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Coupon */}
                <View style={s.couponRow}>
                  <TextInput
                    style={s.couponInput}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    placeholder="Coupon code"
                    placeholderTextColor={colors.gray400}
                  />
                  <Pressable onPress={applyCoupon} style={s.couponBtn}>
                    <Text style={s.couponBtnText}>Apply</Text>
                  </Pressable>
                </View>

                {/* Summary */}
                <View style={s.summaryBox}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Subtotal</Text>
                    <Text style={s.summaryVal}>{formatPrice(subtotal)}</Text>
                  </View>
                  {couponDiscount > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Coupon</Text>
                      <Text style={[s.summaryVal, { color: colors.green600 }]}>
                        -{formatPrice(couponDiscount)}
                      </Text>
                    </View>
                  )}
                  {laybyeItems.length > 0 && (
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Layby Deposits</Text>
                      <Text style={s.summaryVal}>
                        {formatPrice(laybyeDepositTotal)}
                      </Text>
                    </View>
                  )}
                  <View style={[s.summaryRow, s.summaryTotal]}>
                    <Text style={s.summaryTotalLabel}>Due Now</Text>
                    <Text style={s.summaryTotalVal}>
                      {formatPrice(amountDueNow)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* STEP: DETAILS */}
            {step === "details" && (
              <>
                {/* Fulfilment */}
                <Text style={s.sectionLabel}>Fulfilment</Text>
                <View style={s.fulfilmentRow}>
                  {(["delivery", "pickup"] as const).map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setFulfilment(f)}
                      style={[
                        s.fulfilmentOpt,
                        fulfilment === f && s.fulfilmentOptActive,
                      ]}
                    >
                      <Ionicons
                        name={f === "delivery" ? "car-outline" : "storefront-outline"}
                        size={18}
                        color={fulfilment === f ? colors.primary : colors.gray500}
                      />
                      <Text
                        style={[
                          s.fulfilmentText,
                          fulfilment === f && { color: colors.primary },
                        ]}
                      >
                        {f === "delivery" ? "Delivery" : "Pickup"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={s.sectionLabel}>Contact</Text>
                <View style={s.formRow}>
                  <TextInput
                    style={[s.input, { flex: 1 }, fieldErrors.firstName && s.inputError]}
                    value={formData.firstName}
                    onChangeText={(v) => {
                      setFormData((f) => ({ ...f, firstName: v }));
                      if (v.trim()) setFieldErrors((e) => ({ ...e, firstName: false }));
                    }}
                    placeholder="First Name *"
                    placeholderTextColor={colors.gray400}
                  />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={formData.lastName}
                    onChangeText={(v) =>
                      setFormData((f) => ({ ...f, lastName: v }))
                    }
                    placeholder="Last Name"
                    placeholderTextColor={colors.gray400}
                  />
                </View>
                <TextInput
                  style={[s.input, fieldErrors.email && s.inputError]}
                  value={formData.email}
                  onChangeText={(v) => {
                    setFormData((f) => ({ ...f, email: v }));
                    if (v.trim()) setFieldErrors((e) => ({ ...e, email: false }));
                  }}
                  placeholder="Email *"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[s.input, fieldErrors.phone && s.inputError]}
                  value={formData.phone}
                  onChangeText={(v) => {
                    setFormData((f) => ({ ...f, phone: v }));
                    if (v.trim()) setFieldErrors((e) => ({ ...e, phone: false }));
                  }}
                  placeholder="Phone *"
                  placeholderTextColor={colors.gray400}
                  keyboardType="phone-pad"
                />

                {fulfilment === "delivery" ? (
                  <>
                    <Text style={s.sectionLabel}>Delivery Address</Text>
                    <TextInput
                      style={[s.input, fieldErrors.address && s.inputError]}
                      value={formData.address}
                      onChangeText={(v) => {
                        setFormData((f) => ({ ...f, address: v }));
                        if (v.trim()) setFieldErrors((e) => ({ ...e, address: false }));
                      }}
                      placeholder="Street Address *"
                      placeholderTextColor={colors.gray400}
                    />
                    <View style={s.formRow}>
                      <TextInput
                        style={[s.input, { flex: 1 }, fieldErrors.city && s.inputError]}
                        value={formData.city}
                        onChangeText={(v) => {
                          setFormData((f) => ({ ...f, city: v }));
                          if (v.trim()) setFieldErrors((e) => ({ ...e, city: false }));
                        }}
                        placeholder="City *"
                        placeholderTextColor={colors.gray400}
                      />
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={formData.province}
                        onChangeText={(v) =>
                          setFormData((f) => ({ ...f, province: v }))
                        }
                        placeholder="Province"
                        placeholderTextColor={colors.gray400}
                      />
                    </View>
                    <TextInput
                      style={s.input}
                      value={formData.postalCode}
                      onChangeText={(v) =>
                        setFormData((f) => ({ ...f, postalCode: v }))
                      }
                      placeholder="Postal Code"
                      placeholderTextColor={colors.gray400}
                      keyboardType="number-pad"
                    />
                  </>
                ) : (
                  <>
                    <Text style={s.sectionLabel}>Pickup Location</Text>
                    {pickupAddresses.length > 0 ? pickupAddresses.map((p: any) => {
                      const active = selectedPickup === p.label;
                      return (
                        <Pressable
                          key={p.label}
                          onPress={() => setSelectedPickup(p.label)}
                          style={[s.pickupItem, active && s.pickupItemActive]}
                        >
                          <View style={s.paymentRadio}>
                            {active && <View style={s.paymentRadioInner} />}
                          </View>
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

                <Text style={s.sectionLabel}>Payment Method</Text>
                {PAYMENT_METHODS.map((pm) => (
                  <Pressable
                    key={pm.id}
                    onPress={() => setPaymentMethod(pm.id)}
                    style={[
                      s.paymentOpt,
                      paymentMethod === pm.id && s.paymentOptActive,
                    ]}
                  >
                    <Text style={s.paymentIcon}>{pm.icon}</Text>
                    <Text
                      style={[
                        s.paymentLabel,
                        paymentMethod === pm.id && { color: colors.primary },
                      ]}
                    >
                      {pm.label}
                    </Text>
                    <View style={s.paymentRadio}>
                      {paymentMethod === pm.id && (
                        <View style={s.paymentRadioInner} />
                      )}
                    </View>
                  </Pressable>
                ))}

                <TextInput
                  style={[s.input, { height: 70, textAlignVertical: "top" }]}
                  value={formData.notes}
                  onChangeText={(v) =>
                    setFormData((f) => ({ ...f, notes: v }))
                  }
                  placeholder="Order notes (optional)"
                  placeholderTextColor={colors.gray400}
                  multiline
                />
              </>
            )}

            {/* STEP: CONFIRMATION */}
            {step === "confirmation" && (
              <View style={s.confirmWrap}>
                <Text style={s.confirmTitle}>Order Summary</Text>
                {cart.items.map((item, i) => (
                  <View key={i} style={s.confirmItem}>
                    <Text style={s.confirmItemName} numberOfLines={1}>
                      {item.product.name} × {item.quantity}
                    </Text>
                    <Text style={s.confirmItemPrice}>
                      {formatPrice(
                        (item.product.salePrice || item.product.regularPrice) *
                          item.quantity
                      )}
                    </Text>
                  </View>
                ))}
                <View style={s.confirmDivider} />
                <View style={s.confirmItem}>
                  <Text style={s.confirmTotalLabel}>Total Due Now</Text>
                  <Text style={s.confirmTotalVal}>
                    {formatPrice(amountDueNow)}
                  </Text>
                </View>
                <View style={s.confirmItem}>
                  <Text style={s.confirmDetailLabel}>Fulfilment</Text>
                  <Text style={s.confirmDetailVal}>
                    {fulfilment === "delivery" ? "Delivery" : "Pickup"}
                  </Text>
                </View>
                <View style={s.confirmItem}>
                  <Text style={s.confirmDetailLabel}>Payment</Text>
                  <Text style={s.confirmDetailVal}>
                    {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}
                  </Text>
                </View>
                {fulfilment === "pickup" && selectedPickup && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Pickup at</Text>
                    <Text style={s.confirmDetailVal} numberOfLines={2}>
                      {selectedPickup}
                    </Text>
                  </View>
                )}
                {fulfilment === "delivery" && formData.address && (
                  <View style={s.confirmItem}>
                    <Text style={s.confirmDetailLabel}>Ship to</Text>
                    <Text style={s.confirmDetailVal} numberOfLines={2}>
                      {formData.address}, {formData.city}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer buttons */}
          <View style={s.footer}>
            {step === "cart" && (
              <Pressable
                onPress={() => {
                  if (cart.items.length === 0) {
                    Toast.show({ type: "error", text1: "Your cart is empty" });
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
            {step === "details" && (
              <View style={s.footerRow}>
                <Pressable
                  onPress={() => setStep("cart")}
                  style={s.secondaryBtn}
                >
                  <Text style={s.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (validateDetails()) setStep("confirmation");
                  }}
                  style={[s.primaryBtn, { flex: 1 }]}
                >
                  <Text style={s.primaryBtnText}>Review Order</Text>
                </Pressable>
              </View>
            )}
            {step === "confirmation" && (
              <View style={s.footerRow}>
                <Pressable
                  onPress={() => setStep("details")}
                  style={s.secondaryBtn}
                >
                  <Text style={s.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handlePlaceOrder}
                  disabled={submitting}
                  style={[
                    s.primaryBtn,
                    { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
                    submitting && { opacity: 0.6 },
                  ]}
                >
                  <Text style={s.primaryBtnText}>
                    {submitting ? "Placing Order..." : "Place Order"}
                  </Text>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  laybyText: { fontSize: 10, color: colors.amber500, fontWeight: "600" },
  cartItemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cartItemPrice: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
  cartItemQty: { fontSize: 11, color: colors.gray500 },
  couponRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.gray800,
  },
  couponBtn: { backgroundColor: colors.gray800, paddingHorizontal: 16, justifyContent: "center" },
  couponBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  summaryBox: { marginTop: 16, padding: 12, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray100 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: colors.gray600 },
  summaryVal: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 8, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  summaryTotalVal: { fontSize: 15, fontWeight: "700", color: colors.primary },
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
  fulfilmentRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  fulfilmentOpt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  fulfilmentOptActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  fulfilmentText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
  paymentOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 6,
  },
  paymentOptActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paymentIcon: { fontSize: 18 },
  paymentLabel: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.gray700 },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
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
  footer: { borderTopWidth: 1, borderTopColor: colors.gray100, padding: 16, paddingBottom: 34 },
  footerRow: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 13,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.gray700 },
  inputError: { borderColor: colors.red500, borderWidth: 1.5 },
  pickupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 6,
  },
  pickupItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pickupLabel: { fontSize: 14, fontWeight: "600", color: colors.gray800 },
  pickupAddr: { fontSize: 12, color: colors.gray500, marginTop: 2 },
});
