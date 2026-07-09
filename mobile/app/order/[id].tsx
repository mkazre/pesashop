import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductCard from "@/components/ProductCard";
import Toast from "react-native-toast-message";
import { ordersAPI, settingsAPI, productsAPI, viewInvoicePDF } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const getImgSrc = (img: any) => {
  if (!img) return null;
  if (typeof img === "string" && img.startsWith("http")) return img;
  if (typeof img === "string") return `${API_URL}${img}`;
  return null;
};

const JOURNEY_STEPS = [
  { key: "placed",     label: "Order Placed",       icon: "checkmark-circle-outline" as const },
  { key: "confirmed",  label: "Payment Confirmed",  icon: "card-outline" as const },
  { key: "packing",    label: "Packing",            icon: "cube-outline" as const },
  { key: "shipped",    label: "Shipped",            icon: "airplane-outline" as const },
  { key: "delivered",  label: "Delivered",          icon: "home-outline" as const },
];

const SHIPPED_WAYBILL_STATUSES = ["DISPATCHED_FROM_HUB", "OUT_FOR_DELIVERY", "RECEIVED_AT_HUB", "WITH_DELIVERY_DRIVER", "DELIVERED", "COLLECTED"];
const DELIVERED_WAYBILL_STATUSES = ["DELIVERED", "COLLECTED"];

function getActiveStepIdx(order: any): number {
  if (!order) return 0;
  const ps = order.paymentStatus;
  const wb = order.waybill;

  if (wb && DELIVERED_WAYBILL_STATUSES.includes(wb.status)) return 4;
  if (wb && SHIPPED_WAYBILL_STATUSES.includes(wb.status)) return 3;
  if (wb) return 2;
  if (ps === "completed" || ps === "processing") return 1;
  return 0;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>({});
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      ordersAPI.getOne(id),
      settingsAPI.getBankDetails().catch(() => ({ data: { data: [] } })),
      settingsAPI.getPublic().catch(() => ({ data: { data: {} } })),
      productsAPI.getFeatured().catch(() => ({ data: { data: [] } })),
    ]).then(([orderRes, bankRes, storeRes, recRes]) => {
      setOrder(orderRes.data?.data || orderRes.data);
      setBankDetails(bankRes.data?.data || []);
      setStoreInfo(storeRes.data?.data || {});
      const recs = recRes.data?.data || recRes.data || [];
      setRecommended(Array.isArray(recs) ? recs.slice(0, 4) : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Order" showBack />
        <View style={s.center}>
          <Text style={{ color: colors.gray500 }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const isPickup = order.deliveryMethod === "pickup";
  const customer = order.customer || {};
  const shipping = order.shippingAddress || {};
  const pickup = order.pickupAddress || {};
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
  const firstItem = order.items?.[0];
  const shareText = firstItem
    ? `I just purchased '${firstItem.name || firstItem.product?.name}' from PESA Shop!`
    : "I just placed an order at PESA Shop!";

  const phone = storeInfo.storePhone || "+27 73 563 7564";
  const whatsapp = storeInfo.storeWhatsApp || storeInfo.storePhone || "+27735637564";
  const waNumber = whatsapp.replace(/\D/g, "");
  const supportEmail = storeInfo.storeEmail || "hello@pesashop.com";

  const CONTACT_CARDS = [
    { title: "General Queries",    icon: "help-circle-outline" as const, email: supportEmail },
    { title: "Orders & Payments",  icon: "receipt-outline" as const,     email: `orders@${(supportEmail.split("@")[1] || "pesashop.com")}` },
    { title: "Delivery Queries",   icon: "gift-outline" as const,        email: `shipping@${(supportEmail.split("@")[1] || "pesashop.com")}` },
  ];

  return (
    <View style={s.screen}>
      <ScreenHeader title={`Order #${order.orderNumber || order._id?.slice(-8)}`} showBack />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ─── 1. Thank You Header ─── */}
        <View style={s.section}>
          <View style={s.thankyouIcon}>
            <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
          </View>
          <Text style={s.thankyouTitle}>Thank you! Your order has been received.</Text>
          <Text style={s.thankyouSub}>
            Thanks for choosing <Text style={{ fontWeight: "700" }}>PESA Shop!</Text> Our team is already preparing your items. You'll receive a confirmation email shortly.
          </Text>
          <Pressable onPress={() => router.push("/account/track-order" as any)} style={s.trackBtn}>
            <Text style={s.trackBtnText}>Track Your Order</Text>
          </Pressable>
          <Text style={s.orderNum}>Order # {order.orderNumber || order._id?.slice(-8)}</Text>
          <Text style={s.orderDate}>{formattedDate}</Text>
        </View>

        {/* ─── 2. Customer Details ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customer Details</Text>
          <View style={s.sectionDivider} />
          <View style={s.twoCol}>
            {/* Customer info */}
            <View style={[s.card, { flex: 1, marginRight: 6 }]}>
              <Text style={s.cardTitle}>Customer Information</Text>
              {(customer.firstName || shipping.firstName) && (
                <Text style={s.cardRow}><Text style={s.cardLabel}>Name: </Text>{customer.firstName || shipping.firstName} {customer.lastName || shipping.lastName}</Text>
              )}
              {(customer.email || shipping.email) && (
                <Text style={s.cardRow}><Text style={s.cardLabel}>Email: </Text>{customer.email || shipping.email}</Text>
              )}
              {(customer.phone || shipping.phone) && (
                <Text style={s.cardRow}><Text style={s.cardLabel}>Phone: </Text>{customer.phone || shipping.phone}</Text>
              )}
            </View>
            {/* Address */}
            <View style={[s.card, { flex: 1, marginLeft: 6 }]}>
              <Text style={s.cardTitle}>{isPickup ? "Collection Address" : "Shipping Address"}</Text>
              {isPickup ? (
                <>
                  {(pickup.label || pickup.name) && <Text style={s.cardRow}><Text style={s.cardLabel}>Hub: </Text>{pickup.label || pickup.name}</Text>}
                  <Text style={s.cardRow}>{pickup.address || pickup.street || "Address at checkout"}{pickup.city ? `, ${pickup.city}` : ""}</Text>
                </>
              ) : (
                <>
                  {(shipping.firstName || customer.firstName) && <Text style={s.cardRow}>{shipping.firstName || customer.firstName} {shipping.lastName || customer.lastName}</Text>}
                  {(shipping.address || shipping.street) && <Text style={s.cardRow}>{shipping.address || shipping.street}{shipping.city ? `, ${shipping.city}` : ""}{shipping.postalCode ? ` ${shipping.postalCode}` : ""}</Text>}
                </>
              )}
            </View>
          </View>
        </View>

        {/* ─── 3. Order Details ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Details</Text>
          <View style={s.sectionDivider} />
          {order.items?.map((item: any, i: number) => {
            const prod = item.product || {};
            const img = getImgSrc(prod.images?.[0] || prod.featuredImage);
            const lineTotal = item.total || (item.price * item.quantity);
            return (
              <View key={i} style={[s.itemRow, i < order.items.length - 1 && s.itemRowBorder]}>
                <View style={s.itemImg}>
                  {img ? (
                    <Image source={{ uri: img }} style={{ width: 52, height: 52 }} contentFit="contain" />
                  ) : (
                    <View style={s.itemImgPlaceholder}>
                      <Ionicons name="image-outline" size={18} color={colors.gray300} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={s.itemName} numberOfLines={2}>{item.name || prod.name || "Product"}</Text>
                  <Text style={s.itemQty}>× {item.quantity}</Text>
                </View>
                <Text style={s.itemPrice}>{formatPrice(lineTotal)}</Text>
              </View>
            );
          })}
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalVal}>{formatPrice(order.subtotal || 0)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Shipping</Text>
              <Text style={s.totalVal}>{order.shipping > 0 ? formatPrice(order.shipping) : "Free"}</Text>
            </View>
            {order.discount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Discount</Text>
                <Text style={[s.totalVal, { color: "#16a34a" }]}>-{formatPrice(order.discount)}</Text>
              </View>
            )}
            {order.tax > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Tax</Text>
                <Text style={s.totalVal}>{formatPrice(order.tax)}</Text>
              </View>
            )}
            <View style={[s.totalRow, s.grandTotal]}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandVal}>{formatPrice(order.total || 0)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Payment Method</Text>
              <Text style={s.totalVal}>{order.paymentMethod?.replace(/_/g, " ") || "N/A"}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Delivery Method</Text>
              <Text style={s.totalVal}>{isPickup ? "Collect" : "Deliver"}</Text>
            </View>
          </View>

          <View style={s.orderActionsRow}>
            <Pressable
              onPress={async () => {
                setInvoiceLoading(true);
                try {
                  await viewInvoicePDF(order._id, (order.orderNumber || "").replace(/^#?ORD-?/i, "INV-"));
                } catch {
                  Toast.show({ type: "error", text1: "Failed to open invoice" });
                } finally {
                  setInvoiceLoading(false);
                }
              }}
              disabled={invoiceLoading}
              style={s.orderActionBtnDark}
            >
              <Text style={s.orderActionBtnDarkText}>{invoiceLoading ? "Loading..." : "View / Download Invoice"}</Text>
            </Pressable>
            {["delivered", "completed"].includes(order.status) && (
              <Pressable onPress={() => router.push(`/account/returns/new/${order._id}` as any)} style={s.orderActionBtnPrimary}>
                <Text style={s.orderActionBtnPrimaryText}>Request a Return</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ─── 4. Bank Details (EFT only) ─── */}
        {bankDetails.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Payment Details</Text>
            <View style={s.sectionDivider} />
            <Text style={s.bankNote}>
              If you selected EFT/Bank Transfer, please use the details below. Use order #{order.orderNumber || order._id?.slice(-8)} as your reference.
            </Text>
            {bankDetails.map((bank: any, i: number) => (
              <View key={i} style={s.bankCard}>
                <Text style={s.bankName}>{bank.bankName}</Text>
                {bank.accountName   && <View style={s.bankRow}><Text style={s.bankLabel}>Account Name</Text><Text style={s.bankVal}>{bank.accountName}</Text></View>}
                {bank.accountNumber && <View style={s.bankRow}><Text style={s.bankLabel}>Account No.</Text><Text style={s.bankVal}>{bank.accountNumber}</Text></View>}
                {bank.branchCode    && <View style={s.bankRow}><Text style={s.bankLabel}>Branch Code</Text><Text style={s.bankVal}>{bank.branchCode}</Text></View>}
                {bank.accountType   && <View style={s.bankRow}><Text style={s.bankLabel}>Account Type</Text><Text style={s.bankVal}>{bank.accountType}</Text></View>}
                <View style={s.bankRow}><Text style={s.bankLabel}>Reference</Text><Text style={s.bankVal}>#{order.orderNumber || order._id?.slice(-8)}</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* ─── 5. Order Journey ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Order Journey</Text>
          <View style={s.sectionDivider} />
          <Text style={s.journeyNote}>Here are the next steps for your order.</Text>
          {JOURNEY_STEPS.map((step, i) => {
            const currentStepIdx = getActiveStepIdx(order);
            const isActive = i <= currentStepIdx;
            const isCurrent = i === currentStepIdx;
            return (
              <View key={step.key} style={s.journeyStep}>
                {i < JOURNEY_STEPS.length - 1 && (
                  <View style={[s.journeyLine, { backgroundColor: isActive ? "#16a34a" : colors.gray200 }]} />
                )}
                <View style={[s.journeyDot, { backgroundColor: isActive ? "#16a34a" : colors.gray200 }, isCurrent && s.journeyDotActive]}>
                  <Ionicons name={step.icon} size={14} color={isActive ? "#fff" : colors.gray400} />
                </View>
                <View style={s.journeyText}>
                  <Text style={[s.journeyLabel, { color: isActive ? colors.gray900 : colors.gray400 }]}>{step.label}</Text>
                  {isCurrent && <Text style={s.journeyCurrent}>— You are here!</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── 6. Contact Cards ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Need Help?</Text>
          <View style={s.sectionDivider} />
          {CONTACT_CARDS.map((card, i) => (
            <View key={i} style={s.contactCard}>
              <View style={s.contactIconWrap}>
                <Ionicons name={card.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactTitle}>{card.title}</Text>
                <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={s.contactRow}>
                  <Ionicons name="call-outline" size={13} color={colors.gray500} />
                  <Text style={s.contactVal}> {phone}</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)} style={s.contactRow}>
                  <Ionicons name="logo-whatsapp" size={13} color="#16a34a" />
                  <Text style={s.contactVal}> {phone}</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL(`mailto:${card.email}`)} style={s.contactRow}>
                  <Ionicons name="mail-outline" size={13} color={colors.gray500} />
                  <Text style={s.contactVal}> {card.email}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* ─── 7. CTA Buttons ─── */}
        <View style={[s.section, s.ctaRow]}>
          <Pressable onPress={() => router.replace("/(tabs)" as any)} style={[s.ctaBtn, { backgroundColor: "#E8A838", flex: 1, marginRight: 6 }]}>
            <Text style={[s.ctaBtnText, { color: colors.primary }]}>Continue Shopping</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)/account" as any)} style={[s.ctaBtn, { backgroundColor: colors.primary, flex: 1, marginLeft: 6 }]}>
            <Text style={[s.ctaBtnText, { color: "#fff" }]}>My Account</Text>
          </Pressable>
        </View>

        {/* ─── 8. Recommended Products ─── */}
        {recommended.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Items You Would Also Like</Text>
            <View style={s.sectionDivider} />
            <View style={s.recGrid}>
              {recommended.map((prod: any) => (
                <View key={prod._id} style={s.recItem}>
                  <ProductCard product={prod} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── 9. Social Share ─── */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <Text style={s.sectionTitle}>Tell Your Friends!</Text>
          <View style={s.sectionDivider} />
          <Pressable
            onPress={() => Share.share({ message: shareText })}
            style={s.shareBtn}
          >
            <Ionicons name="share-social-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.shareBtnText}>Share This Order</Text>
          </Pressable>
        </View>

      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  section: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900, textAlign: "center", marginBottom: 4 },
  sectionDivider: { width: 48, height: 2, backgroundColor: colors.primary, alignSelf: "center", marginBottom: 16 },

  // Thank You Header
  thankyouIcon: { alignItems: "center", marginBottom: 12 },
  thankyouTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900, textAlign: "center", marginBottom: 8 },
  thankyouSub: { fontSize: 13, color: colors.gray600, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  trackBtn: { backgroundColor: "#E8A838", borderRadius: 4, paddingVertical: 12, paddingHorizontal: 32, alignSelf: "center", marginBottom: 16 },
  trackBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  orderNum: { textAlign: "center", fontWeight: "700", fontSize: 14, color: colors.gray900 },
  orderDate: { textAlign: "center", fontSize: 12, color: colors.gray500, marginTop: 4 },

  // Two column layout
  twoCol: { flexDirection: "row" },
  card: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 6, padding: 12 },
  cardTitle: { fontSize: 12, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  cardLabel: { fontWeight: "600", color: colors.gray700 },
  cardRow: { fontSize: 12, color: colors.gray600, marginBottom: 3, lineHeight: 17 },

  // Items
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  itemImg: { width: 52, height: 52, borderRadius: 4, borderWidth: 1, borderColor: colors.gray100, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  itemImgPlaceholder: { width: 52, height: 52, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 13, color: colors.gray800, fontWeight: "500" },
  itemQty: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "700", color: colors.gray900 },

  // Totals
  totalsBox: { borderTopWidth: 2, borderTopColor: colors.primary, marginTop: 12, paddingTop: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontSize: 11, fontWeight: "600", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5 },
  totalVal: { fontSize: 13, fontWeight: "500", color: colors.gray900 },
  grandTotal: { borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 8, marginTop: 4 },
  grandLabel: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  grandVal: { fontSize: 18, fontWeight: "800", color: colors.gray900 },
  orderActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  orderActionBtnDark: { flexGrow: 1, backgroundColor: colors.gray800, borderRadius: 6, paddingVertical: 12, alignItems: "center" },
  orderActionBtnDarkText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  orderActionBtnPrimary: { flexGrow: 1, backgroundColor: colors.primary, borderRadius: 6, paddingVertical: 12, alignItems: "center" },
  orderActionBtnPrimaryText: { color: colors.white, fontSize: 12, fontWeight: "700" },

  // Bank Details
  bankNote: { fontSize: 12, color: colors.gray600, textAlign: "center", marginBottom: 12, lineHeight: 18 },
  bankCard: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 6, padding: 12, backgroundColor: colors.gray50, marginBottom: 10 },
  bankName: { fontSize: 12, fontWeight: "700", color: colors.gray900, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  bankRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bankLabel: { fontSize: 12, color: colors.gray500 },
  bankVal: { fontSize: 12, fontWeight: "600", color: colors.gray900 },

  // Journey
  journeyNote: { fontSize: 12, color: colors.gray600, marginBottom: 16, lineHeight: 18 },
  journeyStep: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, position: "relative" },
  journeyLine: { position: "absolute", left: 15, top: 28, width: 2, height: 28 },
  journeyDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 },
  journeyDotActive: { shadowColor: "#16a34a", shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  journeyText: { flex: 1, paddingTop: 6 },
  journeyLabel: { fontSize: 13, fontWeight: "700" },
  journeyCurrent: { fontSize: 11, color: "#16a34a", fontWeight: "600", marginTop: 2 },

  // Contact Cards
  contactCard: { flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: colors.gray200, borderRadius: 6, padding: 12, marginBottom: 10 },
  contactIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 },
  contactTitle: { fontSize: 10, fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  contactVal: { fontSize: 12, color: colors.gray600 },

  // CTA
  ctaRow: { flexDirection: "row" },
  ctaBtn: { borderRadius: 4, paddingVertical: 14, alignItems: "center" },
  ctaBtnText: { fontWeight: "700", fontSize: 13 },

  // Recommended
  recGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  recItem: { width: "50%", paddingHorizontal: 4, marginBottom: 8 },

  // Share
  shareBtn: { backgroundColor: colors.primary, borderRadius: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  shareBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
