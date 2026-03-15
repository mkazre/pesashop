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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import ScreenHeader from "@/components/ScreenHeader";
import { ordersAPI, productPageSettingsAPI } from "@/services/api";
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

  const [form, setForm] = useState({
    name: user?.name || "",
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
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (value.trim()) setFieldErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      Toast.show({ type: "error", text1: "Please sign in to place an order" });
      router.push("/auth/login" as any);
      return;
    }
    const errors: Record<string, boolean> = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.email.trim()) errors.email = true;
    if (!form.phone.trim()) errors.phone = true;
    if (deliveryMethod === "delivery" && !form.address.trim()) errors.address = true;
    if (deliveryMethod === "delivery" && !form.city.trim()) errors.city = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const missing = [];
      if (errors.name) missing.push("Name");
      if (errors.email) missing.push("Email");
      if (errors.phone) missing.push("Phone");
      if (errors.address) missing.push("Address");
      if (errors.city) missing.push("City");
      Toast.show({ type: "error", text1: "Required fields missing", text2: missing.join(", ") });
      return;
    }

    setLoading(true);
    try {
      const orderData: any = {
        items: items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.regularPrice,
          variant: item.variant,
          laybye: item.laybye,
        })),
        shippingAddress: {
          name: form.name,
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
        total: getTotal(),
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
      const msg = err.response?.data?.message || "Failed to place order";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={co.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenHeader title="Checkout" showBack />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={co.section}>
          <Text style={co.sectionTitle}>Contact Information</Text>
          <TextInput style={[co.textInput, fieldErrors.name && co.inputError]} placeholder="Full Name *" placeholderTextColor={colors.gray400} value={form.name} onChangeText={(v) => updateForm("name", v)} />
          <TextInput style={[co.textInput, fieldErrors.email && co.inputError]} placeholder="Email *" placeholderTextColor={colors.gray400} value={form.email} onChangeText={(v) => updateForm("email", v)} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[co.textInput, { marginBottom: 0 }, fieldErrors.phone && co.inputError]} placeholder="Phone *" placeholderTextColor={colors.gray400} value={form.phone} onChangeText={(v) => updateForm("phone", v)} keyboardType="phone-pad" />
        </View>

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

        <View style={co.section}>
          <Text style={co.sectionTitle}>Payment Method</Text>
          {[
            { id: "eft", label: "EFT / Bank Transfer", icon: "card-outline" },
            { id: "cash", label: "Cash on Delivery", icon: "cash-outline" },
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

        <View style={co.section}>
          <Text style={co.sectionTitle}>Order Notes (optional)</Text>
          <TextInput style={co.notesInput} placeholder="Any special instructions..." placeholderTextColor={colors.gray400} value={form.notes} onChangeText={(v) => updateForm("notes", v)} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <View style={[co.section, { marginBottom: 16 }]}>
          <Text style={co.sectionTitle}>Order Summary</Text>
          {items.map((item, i) => (
            <View key={i} style={co.summaryRow}>
              <Text style={co.summaryName} numberOfLines={1}>{item.product.name} × {item.quantity}</Text>
              <Text style={co.summaryPrice}>{formatPrice((item.product.salePrice || item.product.regularPrice) * item.quantity)}</Text>
            </View>
          ))}
          <View style={co.totalRow}>
            <Text style={co.totalLabel}>Total</Text>
            <Text style={co.totalValue}>{formatPrice(getTotal())}</Text>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>

      <View style={[co.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={handlePlaceOrder} disabled={loading} style={[co.placeBtn, loading && { opacity: 0.7 }]}>
          <Text style={co.placeBtnText}>{loading ? "Placing Order..." : `Place Order • ${formatPrice(getTotal())}`}</Text>
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
  notesInput: { backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: colors.gray800, borderWidth: 1, borderColor: colors.gray200 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryName: { fontSize: 12, color: colors.gray600, flex: 1 },
  summaryPrice: { fontSize: 12, fontWeight: "600", color: colors.gray800 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 8, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  totalValue: { fontSize: 14, fontWeight: "700", color: colors.primary },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, paddingHorizontal: 16, paddingTop: 12 },
  placeBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center" },
  placeBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  inputError: { borderColor: colors.red500, borderWidth: 1.5 },
});
