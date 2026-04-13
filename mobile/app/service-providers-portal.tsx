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

// ─── Dashboard ─────────────────────────────────────────────
function Dashboard({ provider, token, onLogout }: { provider: any; token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"overview" | "ads" | "plans">("overview");
  const [ads, setAds] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalHttp.get("/api/service-providers/me/ads", authConfig(token)).catch(() => ({ data: { data: [] } })),
      portalHttp.get("/api/service-providers/plans/public").catch(() => ({ data: { data: [] } })),
    ]).then(([adsRes, plansRes]) => {
      setAds(adsRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, [token]);

  const subStatus = provider?.subscriptionStatus || "none";
  const subBadgeColor = subStatus === "active" ? colors.green600 : "#d97706";
  const subBg = subStatus === "active" ? "#dcfce7" : "#fef3c7";

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tab bar */}
      <View style={ds.tabBar}>
        {(["overview", "ads", "plans"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[ds.tabBtn, tab === t && ds.tabBtnActive]}>
            <Text style={[ds.tabText, tab === t && ds.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
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
                <Text style={ds.infoTitle}>How to subscribe to ad slots</Text>
                <Text style={ds.infoText}>
                  1. View available plans in the Plans tab{"\n"}
                  2. Email providers@pesashop.co.za with your preferred plan{"\n"}
                  3. We activate your subscription within 24 hours{"\n"}
                  4. Create ads from pesashop.com/service-providers/portal
                </Text>
                <Pressable onPress={() => Linking.openURL("mailto:providers@pesashop.co.za")} style={ds.emailBtn}>
                  <Text style={ds.emailBtnText}>📧 Contact Us to Subscribe</Text>
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

          {tab === "plans" && (
            <View style={{ gap: 12 }}>
              {plans.length === 0 ? (
                <Text style={{ color: colors.gray400, textAlign: "center", marginTop: 40 }}>No plans published yet.</Text>
              ) : (
                plans.map((plan) => (
                  <View key={plan._id} style={ds.planCard}>
                    <Text style={ds.planName}>{plan.name}</Text>
                    <Text style={ds.planPrice}>R{plan.price}<Text style={ds.planCycle}>/{plan.billingCycle || "month"}</Text></Text>
                    <Text style={ds.planAds}>Up to {plan.maxActiveAds || 1} active ads</Text>
                    {(plan.featuresIncluded || []).map((f: string, i: number) => (
                      <Text key={i} style={ds.planFeature}>✓ {f}</Text>
                    ))}
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:providers@pesashop.co.za?subject=Subscribe to ${plan.name}`)}
                      style={ds.planBtn}
                    >
                      <Text style={ds.planBtnText}>Subscribe →</Text>
                    </Pressable>
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
  tabText: { fontSize: 13, fontWeight: "600", color: colors.gray500 },
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
  planCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 14 },
  planName: { fontSize: 15, fontWeight: "700", color: colors.gray900, marginBottom: 4 },
  planPrice: { fontSize: 22, fontWeight: "800", color: colors.primary },
  planCycle: { fontSize: 13, fontWeight: "400", color: colors.gray500 },
  planAds: { fontSize: 12, color: colors.gray500, marginTop: 2, marginBottom: 8 },
  planFeature: { fontSize: 13, color: colors.gray700, marginBottom: 3 },
  planBtn: { marginTop: 12, borderWidth: 1, borderColor: colors.gray900, paddingVertical: 10, alignItems: "center" },
  planBtnText: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
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
