import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import BottomTabBar from "@/components/BottomTabBar";
import { ordersAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";
import { Image } from "expo-image";

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Payment Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();
  const params = useLocalSearchParams<{ orderNumber?: string; email?: string }>();

  const [orderNumber, setOrderNumber] = useState(params.orderNumber || "");
  const [email, setEmail] = useState(params.email || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  // Auto-search when navigated from orders list with pre-filled details
  useEffect(() => {
    if (!params.orderNumber || !params.email) return;
    setLoading(true);
    ordersAPI.track(params.orderNumber, params.email).then((res) => {
      const data = res.data?.data || res.data?.order || res.data;
      if (data) setOrder(data);
      else Toast.show({ type: "error", text1: "Order not found" });
    }).catch((err: any) => {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Order not found" });
    }).finally(() => setLoading(false));
  }, []);

  const handleTrack = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      Toast.show({ type: "error", text1: "Please enter order number and email" });
      return;
    }
    setLoading(true);
    setOrder(null);
    try {
      const res = await ordersAPI.track(orderNumber.trim(), email.trim());
      const data = res.data?.data || res.data?.order || res.data;
      if (data) {
        setOrder(data);
      } else {
        Toast.show({ type: "error", text1: "Order not found" });
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Order not found. Check your details and try again." });
    } finally {
      setLoading(false);
    }
  };

  // Use waybill status if available (matches web app logic)
  const getStepIndex = (o: any) => {
    if (!o) return -1;
    const wb = o.waybill;
    if (wb) {
      const delivered = ["DELIVERED", "COLLECTED"];
      const shipped = ["DISPATCHED_FROM_HUB", "OUT_FOR_DELIVERY", "RECEIVED_AT_HUB", "WITH_DELIVERY_DRIVER", ...delivered];
      if (delivered.includes(wb.status)) return 4;
      if (shipped.includes(wb.status)) return 3;
      return 2; // waybill exists = packing/processing
    }
    const ps = o.paymentStatus;
    if (ps === "completed" || ps === "processing") return 1;
    return Math.max(STATUS_STEPS.indexOf(o.status), 0);
  };
  const currentStepIndex = getStepIndex(order);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search form */}
        <View style={s.formSection}>
          <Text style={s.formTitle}>Track Your Order</Text>
          <Text style={s.formSub}>Enter your order number and the email address used to place the order.</Text>

          <Text style={s.fieldLabel}>Order Number *</Text>
          <TextInput
            style={s.input}
            value={orderNumber}
            onChangeText={setOrderNumber}
            placeholder="e.g. ORD-123456"
            autoCapitalize="characters"
            placeholderTextColor={colors.gray400}
          />

          <Text style={s.fieldLabel}>Email Address *</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.gray400}
          />

          <Pressable onPress={handleTrack} disabled={loading} style={[s.trackBtn, loading && { opacity: 0.5 }]}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={s.trackBtnText}>Track Order</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Order result */}
        {order && (
          <View style={s.resultSection}>
            {/* Order Info */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Order #{order.orderNumber || order._id?.slice(-8)}</Text>
              <Text style={s.cardDate}>
                Placed on {new Date(order.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
              </Text>
            </View>

            {/* Timeline */}
            <View style={s.card}>
              <Text style={s.cardSectionTitle}>Order Status</Text>
              <View style={s.timeline}>
                {STATUS_STEPS.map((step, i) => {
                  const isComplete = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <View key={step} style={s.timelineStep}>
                      <View style={s.timelineLeft}>
                        <View style={[s.timelineDot, isComplete ? s.dotComplete : s.dotIncomplete, isCurrent && s.dotCurrent]} >
                          {isComplete && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        {i < STATUS_STEPS.length - 1 && (
                          <View style={[s.timelineLine, isComplete ? s.lineComplete : s.lineIncomplete]} />
                        )}
                      </View>
                      <View style={s.timelineContent}>
                        <Text style={[s.timelineLabel, isComplete ? s.labelComplete : s.labelIncomplete]}>
                          {STATUS_LABELS[step] || step}
                        </Text>
                        {isCurrent && <Text style={s.currentBadge}>Current</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Tracking Info */}
            {(order.trackingNumber || order.trackingUrl) && (
              <View style={s.card}>
                <Text style={s.cardSectionTitle}>Tracking Information</Text>
                {order.trackingNumber && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Tracking Number</Text>
                    <Text style={s.infoValue}>{order.trackingNumber}</Text>
                  </View>
                )}
                {order.carrier && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Carrier</Text>
                    <Text style={s.infoValue}>{order.carrier}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Items */}
            <View style={s.card}>
              <Text style={s.cardSectionTitle}>Items ({order.items?.length || 0})</Text>
              {order.items?.map((item: any, i: number) => (
                <View key={i} style={[s.itemRow, i < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.gray100 }]}>
                  {item.image && (
                    <Image source={{ uri: resolveImageUrl(item.image) }} style={s.itemImage} contentFit="cover" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.itemQty}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={s.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            {/* Delivery */}
            {(order.deliveryMethod || order.shippingAddress) && (
              <View style={s.card}>
                <Text style={s.cardSectionTitle}>Delivery Details</Text>
                {order.deliveryMethod && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Method</Text>
                    <Text style={[s.infoValue, { textTransform: "capitalize" }]}>{order.deliveryMethod}</Text>
                  </View>
                )}
                {order.shippingAddress && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={s.infoLabel}>Ship To</Text>
                    <Text style={s.addrText}>
                      {order.shippingAddress.street}{"\n"}
                      {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}{"\n"}
                      {order.shippingAddress.country}
                    </Text>
                  </View>
                )}
                {order.pickupAddress && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={s.infoLabel}>Pickup Location</Text>
                    <Text style={s.addrText}>
                      {order.pickupAddress.label ? `${order.pickupAddress.label}: ` : ""}{order.pickupAddress.address}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Totals */}
            <View style={s.card}>
              <Text style={s.cardSectionTitle}>Order Total</Text>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{formatPrice(order.subtotal || 0)}</Text>
              </View>
              {order.shippingCost > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Shipping</Text>
                  <Text style={s.totalValue}>{formatPrice(order.shippingCost)}</Text>
                </View>
              )}
              {order.discount > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Discount</Text>
                  <Text style={[s.totalValue, { color: colors.green600 }]}>-{formatPrice(order.discount)}</Text>
                </View>
              )}
              <View style={[s.totalRow, { borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 8, marginTop: 4 }]}>
                <Text style={[s.totalLabel, { fontWeight: "700" }]}>Total</Text>
                <Text style={[s.totalValue, { fontWeight: "700", fontSize: 16 }]}>{formatPrice(order.total || order.totalAmount || 0)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  formSection: { backgroundColor: colors.white, padding: 16, marginTop: 1 },
  formTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900, marginBottom: 4 },
  formSub: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 14 },
  input: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 48, fontSize: 15, color: colors.gray800 },
  trackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, paddingVertical: 14, marginTop: 20 },
  trackBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  resultSection: { paddingTop: 8 },
  card: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 8, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  cardDate: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  cardSectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  timeline: {},
  timelineStep: { flexDirection: "row", minHeight: 48 },
  timelineLeft: { width: 32, alignItems: "center" },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dotComplete: { backgroundColor: colors.primary },
  dotIncomplete: { backgroundColor: colors.gray200 },
  dotCurrent: { backgroundColor: colors.primary, borderWidth: 3, borderColor: "#a7f3d0" },
  timelineLine: { width: 2, flex: 1, marginVertical: 2 },
  lineComplete: { backgroundColor: colors.primary },
  lineIncomplete: { backgroundColor: colors.gray200 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontWeight: "600" },
  labelComplete: { color: colors.gray900 },
  labelIncomplete: { color: colors.gray400 },
  currentBadge: { fontSize: 10, fontWeight: "700", color: colors.primary, backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  infoLabel: { fontSize: 13, color: colors.gray500 },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  addrText: { fontSize: 13, color: colors.gray700, lineHeight: 20, marginTop: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  itemImage: { width: 48, height: 48, backgroundColor: colors.gray100 },
  itemName: { fontSize: 13, fontWeight: "500", color: colors.gray800 },
  itemQty: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { fontSize: 13, color: colors.gray600 },
  totalValue: { fontSize: 13, color: colors.gray900 },
});
