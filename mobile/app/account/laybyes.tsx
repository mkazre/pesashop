import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { laybyAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

type Tab = "active" | "history" | "applications";

export default function LaybyesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [laybyes, setLaybyes] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const activeLaybyes = laybyes.filter((l: any) => l.status === "active");
  const historyLaybyes = laybyes.filter((l: any) => l.status !== "active");

  const fetchData = useCallback(async () => {
    try {
      const [layRes, appRes] = await Promise.all([
        laybyAPI.getMyLaybyes().catch(() => ({ data: { data: [] } })),
        laybyAPI.getMyApplications().catch(() => ({ data: { data: [] } })),
      ]);
      setLaybyes(layRes.data?.data || []);
      setApplications(appRes.data?.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return { bg: "#dcfce7", text: "#15803d" };
      case "completed": return { bg: "#dbeafe", text: "#1d4ed8" };
      case "defaulted": case "cancelled": return { bg: "#fee2e2", text: "#dc2626" };
      case "approved": return { bg: "#dcfce7", text: "#15803d" };
      case "pending": return { bg: "#fef3c7", text: "#d97706" };
      case "rejected": return { bg: "#fee2e2", text: "#dc2626" };
      default: return { bg: colors.gray100, text: colors.gray600 };
    }
  };

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
          <Text style={s.headerTitle}>My Laybyes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>My Laybyes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.tabBar}>
        <Pressable onPress={() => setTab("active")} style={[s.tab, tab === "active" && s.tabActive]}>
          <Text style={[s.tabText, tab === "active" && s.tabTextActive]}>Active ({activeLaybyes.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab("history")} style={[s.tab, tab === "history" && s.tabActive]}>
          <Text style={[s.tabText, tab === "history" && s.tabTextActive]}>History ({historyLaybyes.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab("applications")} style={[s.tab, tab === "applications" && s.tabActive]}>
          <Text style={[s.tabText, tab === "applications" && s.tabTextActive]}>Applications ({applications.length})</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {tab === "active" && (
          activeLaybyes.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="card-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyText}>No active laybyes</Text>
              <Text style={s.emptySub}>Your laybye plans will appear here</Text>
            </View>
          ) : (
            activeLaybyes.map((lb: any) => {
              const sc = getStatusColor(lb.status);
              const progress = lb.paidAmount && lb.totalAmount ? Math.round((lb.paidAmount / lb.totalAmount) * 100) : 0;
              return (
                <Pressable key={lb._id} onPress={() => router.push(`/account/laybye-detail?id=${lb._id}` as any)} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle} numberOfLines={1}>Laybye #{lb.laybyeNumber || lb._id.slice(-6)}</Text>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>{lb.status}</Text>
                    </View>
                  </View>
                  {lb.order?.items?.filter((i: any) => i.isLaybye).map((item: any, i: number) => (
                    <Text key={i} style={s.itemName} numberOfLines={1}>{item.product?.name || item.name}</Text>
                  ))}
                  <View style={s.cardRow}>
                    <View>
                      <Text style={s.cardLabel}>Total</Text>
                      <Text style={s.cardValue}>{formatPrice(lb.totalAmount || 0)}</Text>
                    </View>
                    <View>
                      <Text style={s.cardLabel}>Paid</Text>
                      <Text style={[s.cardValue, { color: colors.green600 }]}>{formatPrice(lb.paidAmount || 0)}</Text>
                    </View>
                    <View>
                      <Text style={s.cardLabel}>Remaining</Text>
                      <Text style={[s.cardValue, { color: colors.red500 }]}>{formatPrice(lb.remainingAmount || 0)}</Text>
                    </View>
                  </View>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={s.progressText}>{progress}% paid</Text>
                </Pressable>
              );
            })
          )
        )}

        {tab === "history" && (
          historyLaybyes.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyText}>No completed or cancelled laybyes</Text>
            </View>
          ) : (
            historyLaybyes.map((lb: any) => {
              const sc = getStatusColor(lb.status);
              const progress = lb.paidAmount && lb.totalAmount ? Math.round((lb.paidAmount / lb.totalAmount) * 100) : 0;
              return (
                <Pressable key={lb._id} onPress={() => router.push(`/account/laybye-detail?id=${lb._id}` as any)} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle} numberOfLines={1}>Laybye #{lb.laybyeNumber || lb._id.slice(-6)}</Text>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>{lb.status}</Text>
                    </View>
                  </View>
                  {lb.order?.items?.filter((i: any) => i.isLaybye).map((item: any, i: number) => (
                    <Text key={i} style={s.itemName} numberOfLines={1}>{item.product?.name || item.name}</Text>
                  ))}
                  <View style={s.cardRow}>
                    <View>
                      <Text style={s.cardLabel}>Total</Text>
                      <Text style={s.cardValue}>{formatPrice(lb.totalAmount || 0)}</Text>
                    </View>
                    <View>
                      <Text style={s.cardLabel}>Paid</Text>
                      <Text style={[s.cardValue, { color: colors.green600 }]}>{formatPrice(lb.paidAmount || 0)}</Text>
                    </View>
                    <View>
                      <Text style={s.cardLabel}>Payments</Text>
                      <Text style={s.cardValue}>{lb.payments?.filter((p: any) => p.status === "completed").length || 0}</Text>
                    </View>
                  </View>
                  {progress > 0 && (
                    <>
                      <View style={s.progressBar}>
                        <View style={[s.progressFill, { width: `${progress}%` }]} />
                      </View>
                      <Text style={s.progressText}>{progress}% paid</Text>
                    </>
                  )}
                  <Text style={s.cardDate}>
                    {new Date(lb.updatedAt || lb.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                  </Text>
                </Pressable>
              );
            })
          )
        )}

        {tab === "applications" && (
          applications.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyText}>No applications</Text>
              <Text style={s.emptySub}>Apply for a laybye on any eligible product</Text>
            </View>
          ) : (
            applications.map((app: any) => {
              const sc = getStatusColor(app.status);
              return (
                <View key={app._id} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardTitle}>Application</Text>
                    <View style={[s.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.badgeText, { color: sc.text }]}>{app.status}</Text>
                    </View>
                  </View>
                  <Text style={s.itemName}>{app.firstName} {app.lastName}</Text>
                  <Text style={s.cardDate}>
                    {new Date(app.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                  </Text>
                  {app.adminNotes && <Text style={s.adminNote}>Note: {app.adminNotes}</Text>}
                </View>
              );
            })
          )
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.gray400 },
  tabTextActive: { color: colors.primary },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  card: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  itemName: { fontSize: 13, color: colors.gray600, marginBottom: 4 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.gray100 },
  cardLabel: { fontSize: 10, color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5 },
  cardValue: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginTop: 2 },
  progressBar: { height: 6, backgroundColor: colors.gray200, marginTop: 10, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: colors.primary },
  progressText: { fontSize: 11, color: colors.gray500, marginTop: 4 },
  cardDate: { fontSize: 12, color: colors.gray400 },
  adminNote: { fontSize: 12, color: colors.gray500, fontStyle: "italic", marginTop: 4 },
});
