import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, StyleSheet, Linking
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";
const TOKEN_KEY = "sp_portal_token";
const PROVIDER_KEY = "sp_portal_provider";

const portalHttp = axios.create({ baseURL: API_BASE });

function authConfig(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─── Login Screen ──────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (provider: any, token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password required"); return; }
    setError(""); setLoading(true);
    try {
      const res = await portalHttp.post("/api/service-providers/portal/login", { email, password });
      const { token, provider } = res.data;
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(PROVIDER_KEY, JSON.stringify(provider));
      onLogin(provider, token);
    } catch (e: any) {
      setError(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ls.container}>
      <Text style={ls.title}>Provider Portal</Text>
      <Text style={ls.subtitle}>Sign in to manage your subscription and ads</Text>
      {!!error && <View style={ls.errBox}><Text style={ls.errText}>{error}</Text></View>}
      <View style={ls.field}>
        <Text style={ls.label}>Email</Text>
        <TextInput style={ls.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="your@email.com" placeholderTextColor={colors.gray400} />
      </View>
      <View style={ls.field}>
        <Text style={ls.label}>Password</Text>
        <TextInput style={ls.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.gray400} />
      </View>
      <Pressable style={[ls.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={ls.btnText}>Sign In</Text>}
      </Pressable>
      <Text style={ls.hint}>Not yet a provider? Apply at pesashop.com/service-providers</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.gray500, marginBottom: 24 },
  errBox: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", padding: 10, marginBottom: 12 },
  errText: { fontSize: 13, color: "#dc2626" },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: colors.gray600, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.gray800, backgroundColor: colors.white },
  btn: { backgroundColor: colors.gray900, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 12, color: colors.gray400, textAlign: "center", marginTop: 16 },
});

// ─── Slot Booking Screen ───────────────────────────────────
const DURATION_OPTS = [
  { value: "daily", label: "Daily", rateKey: "dailyRate" },
  { value: "weekly", label: "Weekly", rateKey: "weeklyRate" },
  { value: "monthly", label: "Monthly", rateKey: "monthlyRate" },
  { value: "yearly", label: "Yearly", rateKey: "yearlyRate" },
];

function BookSlotScreen({ token, slots, onOrderPlaced, onBack }: { token: string; slots: any[]; onOrderPlaced: () => void; onBack: () => void }) {
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [durationType, setDurationType] = useState("monthly");
  const [quantity, setQuantity] = useState("1");
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any[]>([]);

  useEffect(() => {
    portalHttp.get("/api/settings/bank-details")
      .then(r => setBankDetails(r.data.data || []))
      .catch(() => {});
  }, []);

  const selectedBank = bankDetails[selectedBankIdx] || null;

  const getRate = (slot: any, dt: string) => {
    const opt = DURATION_OPTS.find(o => o.value === dt);
    return opt ? (slot[opt.rateKey] || 0) : 0;
  };

  const unitPrice = selectedSlot ? getRate(selectedSlot, durationType) : 0;
  const qty = Math.max(1, parseInt(quantity) || 1);
  const totalAmount = unitPrice * qty;

  // Format price using ZAR by default (portal providers always pay in base currency)
  const fmt = (amount: number) => `R${amount.toLocaleString("en-ZA")}`;

  const handlePlaceOrder = async () => {
    if (!selectedSlot) { setError("Select a slot first"); return; }
    if (unitPrice <= 0) { setError("No rate for this duration. Pick another."); return; }
    setError(""); setLoading(true);
    try {
      const res = await portalHttp.post("/api/service-providers/portal/ad-orders", {
        slotId: selectedSlot.slotId,
        durationType,
        quantity: qty,
        paymentMethod: selectedBank ? `bank:${selectedBank.bankName}` : "eft",
        notes,
      }, authConfig(token));
      const order = res.data.data;
      order._selectedBank = selectedBank;
      setSuccess(order);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={bs.successCard}>
          <Text style={bs.successIcon}>✅</Text>
          <Text style={bs.successTitle}>Order Placed!</Text>
          <Text style={bs.successRef}>Ref: {success._id?.slice(-8).toUpperCase()}</Text>
          <View style={bs.summaryBox}>
            <Text style={bs.summaryRow}><Text style={bs.summaryLabel}>Slot: </Text>{success.slotLabel}</Text>
            <Text style={bs.summaryRow}><Text style={bs.summaryLabel}>Duration: </Text>{success.durationType} × {success.quantity}</Text>
            <Text style={bs.summaryRow}><Text style={bs.summaryLabel}>Total: </Text>{fmt(success.totalAmount || 0)}</Text>
          </View>
          {success._selectedBank && (
            <View style={bs.eftBox}>
              <Text style={bs.eftTitle}>Payment Instructions</Text>
              <Text style={bs.eftText}>
                Transfer <Text style={{ fontWeight: "700" }}>{fmt(success.totalAmount || 0)}</Text> to:{"\n\n"}
                Bank: {success._selectedBank.bankName}{"\n"}
                Account Name: {success._selectedBank.accountName}{"\n"}
                Account No: {success._selectedBank.accountNumber}{"\n"}
                {success._selectedBank.branchCode ? `Branch Code: ${success._selectedBank.branchCode}\n` : ""}
                {success._selectedBank.accountType ? `Account Type: ${success._selectedBank.accountType}\n` : ""}
                Reference: {success._id?.slice(-8).toUpperCase()}
              </Text>
              <Pressable onPress={() => Linking.openURL("mailto:providers@pesashop.co.za?subject=Proof of Payment - " + success._id?.slice(-8).toUpperCase())} style={bs.eftBtn}>
                <Text style={bs.eftBtnText}>Email Proof of Payment</Text>
              </Pressable>
            </View>
          )}
          <Pressable onPress={() => { setSuccess(null); setSelectedSlot(null); onOrderPlaced(); }} style={bs.doneBtn}>
            <Text style={bs.doneBtnText}>View My Orders</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (selectedSlot) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Pressable onPress={() => setSelectedSlot(null)} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="chevron-back" size={18} color={colors.gray700} />
          <Text style={{ fontSize: 13, color: colors.gray700, marginLeft: 4 }}>Back to Slots</Text>
        </Pressable>
        <Text style={bs.slotName}>{selectedSlot.slotLabel}</Text>
        <Text style={bs.slotPage}>{selectedSlot.slotPage} page</Text>

        {!!error && <View style={bs.errBox}><Text style={bs.errText}>{error}</Text></View>}

        {/* Duration */}
        <Text style={bs.sectionLabel}>Duration Type</Text>
        <View style={bs.durationRow}>
          {DURATION_OPTS.map(opt => {
            const rate = selectedSlot[opt.rateKey] || 0;
            const active = durationType === opt.value;
            return (
              <Pressable key={opt.value} onPress={() => rate && setDurationType(opt.value)} style={[bs.durationBtn, active && bs.durationBtnActive, !rate && { opacity: 0.3 }]}>
                <Text style={[bs.durationLabel, active && bs.durationLabelActive]}>{opt.label}</Text>
                <Text style={[bs.durationRate, active && bs.durationLabelActive]}>{rate ? fmt(rate) : "N/A"}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Quantity */}
        <Text style={bs.sectionLabel}>Quantity ({durationType}s)</Text>
        <TextInput
          style={bs.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          placeholder="e.g. 3"
          placeholderTextColor={colors.gray400}
        />

        {/* Price summary */}
        <View style={bs.priceBox}>
          <Text style={bs.priceRow}>Rate per {durationType}: <Text style={bs.priceVal}>{fmt(unitPrice)}</Text></Text>
          <Text style={bs.priceRow}>Quantity: <Text style={bs.priceVal}>× {qty}</Text></Text>
          <Text style={bs.priceTotal}>Total: {fmt(totalAmount)}</Text>
        </View>

        {/* Bank details */}
        <Text style={bs.sectionLabel}>Bank Account to Pay</Text>
        {bankDetails.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.gray400, marginBottom: 16 }}>No bank accounts configured. Contact us to arrange payment.</Text>
        ) : (
          <View style={{ marginBottom: 16, gap: 8 }}>
            {bankDetails.map((bank, i) => (
              <Pressable key={i} onPress={() => setSelectedBankIdx(i)} style={[bs.bankCard, selectedBankIdx === i && bs.bankCardActive]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[bs.bankRadio, selectedBankIdx === i && bs.bankRadioActive]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray900 }}>{bank.bankName}</Text>
                    <Text style={{ fontSize: 12, color: colors.gray600 }}>{bank.accountName} · {bank.accountNumber}</Text>
                    {bank.branchCode ? <Text style={{ fontSize: 11, color: colors.gray400 }}>Branch: {bank.branchCode}</Text> : null}
                    {bank.accountType ? <Text style={{ fontSize: 11, color: colors.gray400 }}>Type: {bank.accountType}</Text> : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Notes */}
        <Text style={bs.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[bs.input, { height: 70, textAlignVertical: "top" }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special requests…"
          placeholderTextColor={colors.gray400}
          multiline
        />

        <Pressable onPress={handlePlaceOrder} disabled={loading || unitPrice <= 0} style={[bs.orderBtn, (loading || unitPrice <= 0) && { opacity: 0.5 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={bs.orderBtnText}>Place Order — {fmt(totalAmount)}</Text>}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={18} color={colors.gray700} />
        <Text style={{ fontSize: 13, color: colors.gray700, marginLeft: 4 }}>Back</Text>
      </Pressable>
      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray900, marginBottom: 4 }}>Available Ad Slots</Text>
      <Text style={{ fontSize: 13, color: colors.gray500, marginBottom: 16 }}>Tap a slot to book it</Text>
      {slots.length === 0 && <Text style={{ color: colors.gray400, textAlign: "center", marginTop: 40 }}>No slots configured yet.</Text>}
      {slots.map(slot => (
        <View key={slot._id} style={bs.slotCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={bs.slotCardName}>{slot.slotLabel}</Text>
              <Text style={bs.slotCardPage}>{slot.slotPage} page</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {DURATION_OPTS.map(opt => {
                  const rate = slot[opt.rateKey] || 0;
                  if (!rate) return null;
                  return <Text key={opt.value} style={bs.slotRate}>{opt.label}: <Text style={{ fontWeight: "700" }}>R{rate.toLocaleString("en-ZA")}</Text></Text>;
                })}
              </View>
            </View>
            <Pressable onPress={() => setSelectedSlot(slot)} style={bs.bookBtn}>
              <Text style={bs.bookBtnText}>Book</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Orders Screen ─────────────────────────────────────────
function OrdersScreen({ token, onBack }: { token: string; onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalHttp.get("/api/service-providers/portal/ad-orders", authConfig(token))
      .then(r => setOrders(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const getBadgeColors = (status: string) => {
    if (status === "active") return { bg: "#dcfce7", text: "#166534" };
    if (status === "pending_payment") return { bg: "#fef3c7", text: "#854d0e" };
    if (status === "declined") return { bg: "#fee2e2", text: "#991b1b" };
    return { bg: "#f3f4f6", text: "#6b7280" };
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={18} color={colors.gray700} />
        <Text style={{ fontSize: 13, color: colors.gray700, marginLeft: 4 }}>Back</Text>
      </Pressable>
      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray900, marginBottom: 4 }}>My Ad Orders</Text>

      {/* EFT details notice */}
      <View style={os.eftNotice}>
        <Text style={os.eftNoticeText}>EFT: FNB · 62XXXXXXXX · Branch 250655{"\n"}Use order reference as payment ref.{"\n"}Email proof to providers@pesashop.co.za</Text>
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
        orders.length === 0 ? (
          <Text style={{ color: colors.gray400, textAlign: "center", marginTop: 40 }}>No orders yet.</Text>
        ) : (
          orders.map(order => {
            const bc = getBadgeColors(order.status);
            return (
              <View key={order._id} style={os.orderCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={os.slotName}>{order.slotLabel || order.slotId}</Text>
                    <Text style={os.slotPage}>{order.slotPage}</Text>
                    <Text style={os.orderMeta}>{order.durationType} × {order.quantity} · R{(order.totalAmount || 0).toLocaleString()} · {order.paymentMethod?.toUpperCase()}</Text>
                    <Text style={os.orderRef}>Ref: {order._id?.slice(-8).toUpperCase()}</Text>
                    {order.status === "active" && order.endDate && (
                      <Text style={os.orderExpiry}>Active until {new Date(order.endDate).toLocaleDateString()}</Text>
                    )}
                    {order.status === "declined" && order.declineReason && (
                      <Text style={os.declineReason}>Reason: {order.declineReason}</Text>
                    )}
                  </View>
                  <View style={[os.badge, { backgroundColor: bc.bg }]}>
                    <Text style={[os.badgeText, { color: bc.text }]}>{order.status?.replace("_", " ").toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )
      )}
    </ScrollView>
  );
}

// ─── Dashboard ─────────────────────────────────────────────
function Dashboard({ provider, token, onLogout }: { provider: any; token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"overview" | "book" | "orders" | "ads">("overview");
  const [ads, setAds] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalHttp.get("/api/service-providers/me/ads", authConfig(token)).catch(() => ({ data: { data: [] } })),
      portalHttp.get("/api/service-providers/portal/slots", authConfig(token)).catch(() => ({ data: { data: [] } })),
    ]).then(([adsRes, slotsRes]) => {
      setAds(adsRes.data?.data || []);
      setSlots(slotsRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, [token]);

  const subStatus = provider?.subscriptionStatus || "none";
  const subBadgeColor = subStatus === "active" ? colors.green600 : "#d97706";
  const subBg = subStatus === "active" ? "#dcfce7" : "#fef3c7";

  // For book/orders we use full-screen sub-views within the scroll
  if (tab === "book") {
    return (
      <View style={{ flex: 1 }}>
        <BookSlotScreen
          token={token}
          slots={slots}
          onOrderPlaced={() => setTab("orders")}
          onBack={() => setTab("overview")}
        />
      </View>
    );
  }

  if (tab === "orders") {
    return (
      <View style={{ flex: 1 }}>
        <OrdersScreen token={token} onBack={() => setTab("overview")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tab bar */}
      <View style={ds.tabBar}>
        {([
          { id: "overview", label: "Overview" },
          { id: "book", label: "Book Slot" },
          { id: "orders", label: "Orders" },
          { id: "ads", label: "Ads" },
        ] as const).map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={[ds.tabBtn, tab === t.id && ds.tabBtnActive]}>
            <Text style={[ds.tabText, tab === t.id && ds.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {tab === "overview" && (
            <View style={{ gap: 14 }}>
              <View style={[ds.subCard, { backgroundColor: subBg }]}>
                <Text style={ds.subLabel}>Subscription Status</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <View style={[ds.subBadge, { backgroundColor: subBadgeColor }]}>
                    <Text style={ds.subBadgeText}>{subStatus.replace("_", " ").toUpperCase()}</Text>
                  </View>
                  {provider?.subscriptionPlan?.name && <Text style={ds.subPlanName}>{provider.subscriptionPlan.name}</Text>}
                </View>
                {provider?.subscriptionExpiry && (
                  <Text style={ds.subExpiry}>Expires: {new Date(provider.subscriptionExpiry).toLocaleDateString()}</Text>
                )}
              </View>

              <View style={ds.statsRow}>
                {[
                  { label: "Total Ads", value: ads.length },
                  { label: "Active", value: ads.filter((a) => a.status === "active").length },
                  { label: "Pending", value: ads.filter((a) => a.status === "pending").length },
                ].map((s) => (
                  <View key={s.label} style={ds.statCard}>
                    <Text style={ds.statValue}>{s.value}</Text>
                    <Text style={ds.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <View style={ds.infoCard}>
                <Text style={ds.infoTitle}>How ad booking works</Text>
                <Text style={ds.infoText}>
                  1. Book a slot → select duration & pay method{"\n"}
                  2. Transfer payment using your order ref{"\n"}
                  3. We confirm & activate within 24 hours{"\n"}
                  4. Create your ad creative in the Ads tab
                </Text>
                <Pressable onPress={() => setTab("book")} style={ds.emailBtn}>
                  <Text style={ds.emailBtnText}>🛒 Book an Ad Slot</Text>
                </Pressable>
              </View>
            </View>
          )}

          {tab === "ads" && (
            <View style={{ gap: 10 }}>
              {ads.length === 0 ? (
                <View style={ds.emptyCard}>
                  <Text style={ds.emptyIcon}>📢</Text>
                  <Text style={ds.emptyTitle}>No ads yet</Text>
                  <Text style={ds.emptyText}>Create ads from the web portal at pesashop.com/service-providers/portal</Text>
                  <Pressable onPress={() => Linking.openURL("https://pesashop.com/service-providers/portal")} style={ds.emptyBtn}>
                    <Text style={ds.emptyBtnText}>Open Web Portal</Text>
                  </Pressable>
                </View>
              ) : (
                ads.map((ad) => (
                  <View key={ad._id} style={ds.adCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={ds.adTitle} numberOfLines={2}>{ad.title}</Text>
                      <View style={[ds.adBadge, {
                        backgroundColor: ad.status === "active" ? "#dcfce7" : ad.status === "pending" ? "#fef3c7" : "#fee2e2"
                      }]}>
                        <Text style={[ds.adBadgeText, {
                          color: ad.status === "active" ? "#166534" : ad.status === "pending" ? "#854d0e" : "#991b1b"
                        }]}>{ad.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    {ad.body ? <Text style={ds.adBody} numberOfLines={2}>{ad.body}</Text> : null}
                    <Text style={ds.adDate}>{new Date(ad.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  tabBar: { flexDirection: "row", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.gray500 },
  tabTextActive: { color: colors.primary },
  subCard: { padding: 14, borderWidth: 1, borderColor: colors.gray200 },
  subLabel: { fontSize: 12, color: colors.gray500, fontWeight: "600" },
  subBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  subBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  subPlanName: { fontSize: 13, color: colors.gray700 },
  subExpiry: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  infoCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 14 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
  emailBtn: { marginTop: 12, backgroundColor: colors.gray900, paddingVertical: 10, alignItems: "center" },
  emailBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  emptyCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 32, alignItems: "center" },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyText: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 6, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  adCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 12 },
  adTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, flex: 1, marginRight: 8 },
  adBody: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  adDate: { fontSize: 11, color: colors.gray400, marginTop: 6 },
  adBadge: { paddingHorizontal: 6, paddingVertical: 2 },
  adBadgeText: { fontSize: 10, fontWeight: "700" },
});

// BookSlotScreen styles
const bs = StyleSheet.create({
  errBox: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca", padding: 10, marginBottom: 12 },
  errText: { fontSize: 13, color: "#dc2626" },
  slotName: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 2 },
  slotPage: { fontSize: 12, color: colors.gray500, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: colors.gray600, marginBottom: 8 },
  durationRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  durationBtn: { flex: 1, minWidth: 70, borderWidth: 1, borderColor: colors.gray200, padding: 8, alignItems: "center" },
  durationBtnActive: { borderColor: colors.primary, backgroundColor: "#f0f9ff" },
  durationLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
  durationLabelActive: { color: colors.primary },
  durationRate: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  input: { borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray800, marginBottom: 16 },
  priceBox: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, padding: 12, marginBottom: 16 },
  priceRow: { fontSize: 13, color: colors.gray600, marginBottom: 4 },
  priceVal: { fontWeight: "600", color: colors.gray900 },
  priceTotal: { fontSize: 15, fontWeight: "800", color: colors.gray900, marginTop: 6 },
  pmBtn: { flex: 1, borderWidth: 1, borderColor: colors.gray200, paddingVertical: 10, alignItems: "center" },
  pmBtnActive: { borderColor: colors.primary, backgroundColor: "#f0f9ff" },
  pmText: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
  pmTextActive: { color: colors.primary },
  orderBtn: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  orderBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Slot list
  slotCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 14, marginBottom: 10 },
  slotCardName: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  slotCardPage: { fontSize: 12, color: colors.gray400, marginBottom: 4 },
  slotRate: { fontSize: 12, color: colors.gray600 },
  bookBtn: { backgroundColor: colors.gray900, paddingHorizontal: 14, paddingVertical: 8 },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  // Success
  successCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 24, alignItems: "center" },
  successIcon: { fontSize: 40, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900, marginBottom: 4 },
  successRef: { fontSize: 13, color: colors.gray500, fontFamily: "monospace", marginBottom: 16 },
  summaryBox: { width: "100%", backgroundColor: colors.gray50, padding: 12, marginBottom: 12 },
  summaryRow: { fontSize: 13, color: colors.gray700, marginBottom: 4 },
  summaryLabel: { fontWeight: "600" },
  eftBox: { width: "100%", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", padding: 12, marginBottom: 16 },
  eftTitle: { fontSize: 13, fontWeight: "700", color: "#1d4ed8", marginBottom: 6 },
  eftText: { fontSize: 12, color: "#1e40af", lineHeight: 18 },
  eftBtn: { marginTop: 10, backgroundColor: "#1d4ed8", paddingVertical: 8, alignItems: "center" },
  eftBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  doneBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32, marginTop: 4 },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bankCard: { borderWidth: 1, borderColor: colors.gray200, padding: 12, borderRadius: 8, backgroundColor: colors.white },
  bankCardActive: { borderColor: colors.primary, backgroundColor: "#f0f9ff" },
  bankRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.gray300, backgroundColor: colors.white },
  bankRadioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
});

// OrdersScreen styles
const os = StyleSheet.create({
  eftNotice: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", padding: 12, marginBottom: 16 },
  eftNoticeText: { fontSize: 12, color: "#1e40af", lineHeight: 18 },
  orderCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 12, marginBottom: 10 },
  slotName: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  slotPage: { fontSize: 12, color: colors.gray400 },
  orderMeta: { fontSize: 12, color: colors.gray600, marginTop: 4 },
  orderRef: { fontSize: 11, color: colors.gray400, fontFamily: "monospace", marginTop: 2 },
  orderExpiry: { fontSize: 11, color: "#166534", marginTop: 2 },
  declineReason: { fontSize: 11, color: "#991b1b", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0, marginLeft: 8, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, fontWeight: "700" },
});

// ─── Main Screen ────────────────────────────────────────────
export default function ServiceProvidersPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([TOKEN_KEY, PROVIDER_KEY]).then(([tokenItem, providerItem]) => {
      const t = tokenItem[1];
      const p = providerItem[1];
      if (t && p) {
        try {
          setToken(t);
          setProvider(JSON.parse(p));
        } catch {}
      }
    }).finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, PROVIDER_KEY]);
    setProvider(null);
    setToken("");
  };

  if (checking) {
    return (
      <View style={[{ flex: 1, justifyContent: "center", alignItems: "center" }, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: colors.gray50 }, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray900, flex: 1 }}>Service Provider Portal</Text>
        {provider && (
          <Pressable onPress={handleLogout}>
            <Text style={{ fontSize: 13, color: colors.red500, fontWeight: "600" }}>Sign Out</Text>
          </Pressable>
        )}
      </View>

      {!provider ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <LoginScreen onLogin={(p, t) => { setProvider(p); setToken(t); }} />
        </ScrollView>
      ) : (
        <Dashboard provider={provider} token={token} onLogout={handleLogout} />
      )}
      <BottomTabBar />
    </View>
  );
}
