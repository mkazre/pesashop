import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { loyaltyAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

type Tab = "activity" | "history" | "convert";

export default function LoyaltyPointsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [tab, setTab] = useState<Tab>("activity");

  const [convertPoints, setConvertPoints] = useState("");
  const [converting, setConverting] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await loyaltyAPI.getMyOverview();
      if (res.data?.success) setOverview(res.data.data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = async (page = 1) => {
    try {
      const res = await loyaltyAPI.getHistory({ page, limit: 20 });
      if (res.data?.success) {
        setHistory(res.data.data);
        setHistoryPages(res.data.pagination?.pages || 1);
        setHistoryPage(page);
      }
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory(1);
  }, [tab]);

  const handleConvert = async () => {
    const pts = parseInt(convertPoints);
    if (!pts || pts <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid points amount" });
      return;
    }
    setConverting(true);
    try {
      const res = await loyaltyAPI.convertPoints(pts);
      if (res.data?.success) {
        Toast.show({ type: "success", text1: res.data.message || "Points converted!" });
        setConvertPoints("");
        fetchOverview();
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to convert" });
    } finally {
      setConverting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      earned: "Earned", redeemed: "Redeemed", expired: "Expired", adjusted: "Adjusted",
      signup_bonus: "Signup Bonus", daily_login: "Daily Login", profile_complete: "Profile Complete",
      referral_registration: "Referral", referral_purchase: "Referral Purchase", top_customer: "Top Customer",
      level_achievement: "Level Up", birthday_bonus: "Birthday", review_bonus: "Review",
      order_count_bonus: "Order Milestone", cart_total_bonus: "Cart Milestone",
      total_spent_bonus: "Spending Milestone", shared_out: "Shared (Sent)", shared_in: "Shared (Received)",
      converted: "Converted to Credit",
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <View style={[ls.screen, { paddingTop: insets.top }]}>
        <View style={ls.header}>
          <Pressable onPress={() => router.back()} style={ls.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
          <Text style={ls.headerTitle}>PESA Coins</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={ls.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!overview || !overview.enabled) {
    return (
      <View style={[ls.screen, { paddingTop: insets.top }]}>
        <View style={ls.header}>
          <Pressable onPress={() => router.back()} style={ls.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
          <Text style={ls.headerTitle}>PESA Coins</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={ls.center}>
          <Text style={ls.emptyText}>PESA Coins program is currently not available.</Text>
        </View>
      </View>
    );
  }

  const labels = overview.labels || { points: "PESA Coins", point: "PESA Coin" };
  const redemptionRate = overview.redemptionRate || 0;

  return (
    <View style={[ls.screen, { paddingTop: insets.top }]}>
      <View style={ls.header}>
        <Pressable onPress={() => router.back()} style={ls.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={ls.headerTitle}>PESA Coins</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOverview(); }} />}
      >
        {/* Stats Cards */}
        <View style={ls.statsRow}>
          <View style={[ls.statCard, ls.statPrimary]}>
            <Text style={ls.statLabel}>Balance</Text>
            <Text style={ls.statValueBig}>{(overview.balance || 0).toLocaleString()}</Text>
            <Text style={ls.statSub}>{labels.points}</Text>
          </View>
          <View style={ls.statCard}>
            <Text style={ls.statLabelDark}>Cash Value</Text>
            <Text style={ls.statValueDark}>{formatPrice(overview.cashValueZAR || 0)}</Text>
            <Text style={ls.statSubDark}>1 {labels.point} = {formatPrice(redemptionRate)}</Text>
          </View>
        </View>

        <View style={ls.statsRow}>
          <View style={ls.statCard}>
            <Text style={ls.statLabelDark}>Level</Text>
            <Text style={[ls.statValueDark, { color: overview.currentLevel?.color || colors.primary }]}>
              {overview.currentLevel?.name || "None"}
            </Text>
            {overview.currentLevel?.badgeIcon && <Text style={{ fontSize: 16 }}>{overview.currentLevel.badgeIcon}</Text>}
          </View>
          <View style={ls.statCard}>
            <Text style={ls.statLabelDark}>Next Level</Text>
            {overview.nextLevel ? (
              <>
                <Text style={ls.statValueDark}>{overview.nextLevel.name}</Text>
                <Text style={ls.statSubDark}>{(overview.pointsToNextLevel || 0).toLocaleString()} to go</Text>
                <View style={ls.progressBar}>
                  <View style={[ls.progressFill, { width: `${Math.min(100, overview.nextLevel.minPoints > 0 ? ((overview.balance / overview.nextLevel.minPoints) * 100) : 0)}%` }]} />
                </View>
              </>
            ) : (
              <Text style={[ls.statValueDark, { color: colors.green600 }]}>Max Level!</Text>
            )}
          </View>
        </View>

        {/* Expiring warning */}
        {overview.expiringPoints > 0 && (
          <View style={ls.warningBox}>
            <Ionicons name="warning" size={16} color="#dc2626" />
            <Text style={ls.warningText}>
              <Text style={{ fontWeight: "700" }}>{overview.expiringPoints.toLocaleString()}</Text> {labels.points.toLowerCase()} expiring in 30 days!
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={ls.tabBar}>
          {([
            { key: "activity" as Tab, label: "Recent" },
            { key: "history" as Tab, label: "History" },
            { key: "convert" as Tab, label: "Convert" },
          ]).map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[ls.tab, tab === t.key && ls.tabActive]}>
              <Text style={[ls.tabText, tab === t.key && ls.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {tab === "activity" && (
          <View style={ls.section}>
            {overview.recentTransactions && overview.recentTransactions.length > 0 ? (
              overview.recentTransactions.map((tx: any) => (
                <View key={tx._id} style={ls.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={ls.txReason}>{tx.reason || getTypeLabel(tx.type)}</Text>
                    <Text style={ls.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[ls.txPoints, { color: tx.points >= 0 ? colors.green600 : colors.red500 }]}>
                      {tx.points >= 0 ? "+" : ""}{tx.points}
                    </Text>
                    <Text style={ls.txValue}>{formatPrice(Math.abs(tx.points) * redemptionRate)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={ls.emptyText}>No transactions yet</Text>
            )}
          </View>
        )}

        {tab === "history" && (
          <View style={ls.section}>
            {history.length > 0 ? (
              <>
                {history.map((tx: any) => (
                  <View key={tx._id} style={ls.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={ls.txReason}>{tx.reason || getTypeLabel(tx.type)}</Text>
                      <Text style={ls.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[ls.txPoints, { color: tx.points >= 0 ? colors.green600 : colors.red500 }]}>
                        {tx.points >= 0 ? "+" : ""}{tx.points}
                      </Text>
                      {tx.balanceAfter != null && (
                        <Text style={ls.txValue}>Bal: {tx.balanceAfter.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                ))}
                {historyPages > 1 && (
                  <View style={ls.paginationRow}>
                    <Pressable onPress={() => fetchHistory(historyPage - 1)} disabled={historyPage <= 1} style={[ls.pageBtn, historyPage <= 1 && ls.pageBtnDisabled]}>
                      <Text style={ls.pageBtnText}>Previous</Text>
                    </Pressable>
                    <Text style={ls.pageInfo}>Page {historyPage} of {historyPages}</Text>
                    <Pressable onPress={() => fetchHistory(historyPage + 1)} disabled={historyPage >= historyPages} style={[ls.pageBtn, historyPage >= historyPages && ls.pageBtnDisabled]}>
                      <Text style={ls.pageBtnText}>Next</Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <Text style={ls.emptyText}>No transaction history</Text>
            )}
          </View>
        )}

        {tab === "convert" && (
          <View style={ls.section}>
            <Text style={ls.sectionTitle}>Convert to Store Credit</Text>
            <Text style={ls.sectionSub}>
              Convert your {labels.points.toLowerCase()} into store credit you can use on any purchase.
            </Text>

            <View style={ls.infoBox}>
              <View style={ls.infoRow}>
                <Text style={ls.infoLabel}>Your {labels.points}</Text>
                <Text style={ls.infoValue}>{(overview.balance || 0).toLocaleString()}</Text>
              </View>
              <View style={ls.infoRow}>
                <Text style={ls.infoLabel}>Rate</Text>
                <Text style={ls.infoValue}>1 {labels.point} = {formatPrice(redemptionRate)}</Text>
              </View>
              <View style={[ls.infoRow, { borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 8, marginTop: 4 }]}>
                <Text style={ls.infoLabel}>Total Value</Text>
                <Text style={[ls.infoValue, { color: colors.green600 }]}>{formatPrice(overview.cashValueZAR || 0)}</Text>
              </View>
            </View>

            <Text style={ls.fieldLabel}>{labels.points} to Convert</Text>
            <TextInput
              style={ls.input}
              value={convertPoints}
              onChangeText={setConvertPoints}
              placeholder="e.g. 500"
              keyboardType="numeric"
              placeholderTextColor={colors.gray400}
            />
            {convertPoints && parseInt(convertPoints) > 0 && (
              <Text style={ls.convertPreview}>
                You'll receive {formatPrice(parseInt(convertPoints) * redemptionRate)} in store credit
              </Text>
            )}

            <Pressable onPress={handleConvert} disabled={converting} style={[ls.convertBtn, converting && { opacity: 0.5 }]}>
              <Text style={ls.convertBtnText}>{converting ? "Converting..." : "Convert to Store Credit"}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const ls = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  statPrimary: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  statValueBig: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 2 },
  statSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  statLabelDark: { fontSize: 12, color: colors.gray500, fontWeight: "500" },
  statValueDark: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  statSubDark: { fontSize: 10, color: colors.gray400, marginTop: 2 },
  progressBar: { height: 6, backgroundColor: colors.gray200, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#f59e0b" },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", marginHorizontal: 16, marginTop: 12, padding: 12 },
  warningText: { flex: 1, fontSize: 12, color: "#dc2626" },
  tabBar: { flexDirection: "row", backgroundColor: colors.white, marginTop: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#f59e0b" },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.gray400 },
  tabTextActive: { color: "#f59e0b" },
  section: { backgroundColor: colors.white, marginTop: 1, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  txReason: { fontSize: 14, fontWeight: "500", color: colors.gray900 },
  txDate: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  txPoints: { fontSize: 14, fontWeight: "700" },
  txValue: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  emptyText: { fontSize: 14, color: colors.gray400, textAlign: "center", paddingVertical: 24 },
  paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 16 },
  pageBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.gray200 },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 12, color: colors.gray700 },
  pageInfo: { fontSize: 12, color: colors.gray500 },
  infoBox: { backgroundColor: colors.gray50, padding: 14, marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  infoLabel: { fontSize: 13, color: colors.gray600 },
  infoValue: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  input: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 14, height: 48, fontSize: 16, color: colors.gray800 },
  convertPreview: { fontSize: 13, color: colors.green600, fontWeight: "500", marginTop: 6 },
  convertBtn: { backgroundColor: colors.green600, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  convertBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
