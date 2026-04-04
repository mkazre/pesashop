import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import BottomTabBar from "@/components/BottomTabBar";
import { ordersAPI, laybyAPI, loyaltyAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

export default function DashboardScreen() {
  const router = useRouter();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeLaybyes: 0,
    outstandingBalance: 0,
    pesaCoins: 0,
  });
  const [pendingApplications, setPendingApplications] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, laybyesRes, loyaltyRes] = await Promise.all([
          ordersAPI.getAll({ limit: 1 }).catch(() => null),
          laybyAPI.getMyLaybyes().catch(() => null),
          loyaltyAPI.getMyOverview().catch(() => null),
        ]);

        const totalOrders = ordersRes?.data?.total || ordersRes?.data?.count || 0;
        const laybyes: any[] = laybyesRes?.data?.data || laybyesRes?.data || [];
        const active = laybyes.filter((l) => l.status === "active");
        const outstanding = active.reduce((sum: number, l: any) => sum + (l.remainingAmount || 0), 0);
        const pending = laybyes.filter((l) => l.status === "pending").length;
        const coins = loyaltyRes?.data?.data?.balance || loyaltyRes?.data?.data?.points || 0;

        // Upcoming payments: active laybyes with nextPaymentDate in next 7 days
        const now = new Date();
        const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = active.filter((l: any) => {
          if (!l.nextPaymentDate) return false;
          const d = new Date(l.nextPaymentDate);
          return d >= now && d <= in7days;
        });

        setStats({ totalOrders, activeLaybyes: active.length, outstandingBalance: outstanding, pesaCoins: coins });
        setPendingApplications(pending);
        setUpcomingPayments(upcoming);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: "Total Orders",           value: String(stats.totalOrders),                  icon: "receipt-outline" as const,       color: colors.primary,    route: "/orders" },
    { label: "Active Laybyes",          value: String(stats.activeLaybyes),                icon: "card-outline" as const,          color: "#7c3aed",         route: "/account/laybyes" },
    { label: "Outstanding Balance",     value: formatPrice(stats.outstandingBalance),      icon: "wallet-outline" as const,        color: "#dc2626",         route: "/account/laybyes" },
    { label: "PESA Coins",              value: String(stats.pesaCoins),                    icon: "star-outline" as const,          color: "#d97706",         route: "/account/loyalty-points" },
  ];

  const QUICK_LINKS = [
    { label: "View Orders",       icon: "receipt-outline" as const,       route: "/orders" },
    { label: "My Laybyes",        icon: "card-outline" as const,          route: "/account/laybyes" },
    { label: "Loyalty Points",    icon: "star-outline" as const,          route: "/account/loyalty-points" },
    { label: "Payments",          icon: "cash-outline" as const,          route: "/account/payments" },
    { label: "Transactions",      icon: "list-outline" as const,          route: "/account/transactions" },
    { label: "Addresses",         icon: "location-outline" as const,      route: "/account/addresses" },
  ];

  return (
    <View style={s.screen}>
      <ScreenHeader title="My Dashboard" showBack />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Stat Cards */}
            <View style={s.statsGrid}>
              {STAT_CARDS.map((card) => (
                <Pressable key={card.label} onPress={() => router.push(card.route as any)} style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: card.color + "18" }]}>
                    <Ionicons name={card.icon} size={22} color={card.color} />
                  </View>
                  <Text style={s.statValue}>{card.value}</Text>
                  <Text style={s.statLabel}>{card.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Pending Applications Alert */}
            {pendingApplications > 0 && (
              <Pressable onPress={() => router.push("/account/laybyes" as any)} style={s.alertBanner}>
                <Ionicons name="time-outline" size={18} color="#92400e" />
                <Text style={s.alertText}>
                  You have <Text style={{ fontWeight: "700" }}>{pendingApplications}</Text> pending layby {pendingApplications === 1 ? "application" : "applications"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#92400e" />
              </Pressable>
            )}

            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Upcoming Payments (next 7 days)</Text>
                {upcomingPayments.map((laybye: any, i: number) => (
                  <Pressable key={i} onPress={() => router.push("/account/laybyes" as any)} style={s.upcomingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.upcomingOrder}>Order #{laybye.order?.orderNumber || "N/A"}</Text>
                      <Text style={s.upcomingDate}>
                        Due: {new Date(laybye.nextPaymentDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </Text>
                    </View>
                    <Text style={s.upcomingAmount}>{formatPrice(laybye.installmentPlan?.installmentAmount || 0)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray400} style={{ marginLeft: 8 }} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Quick Links */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quick Access</Text>
              <View style={s.quickGrid}>
                {QUICK_LINKS.map((link) => (
                  <Pressable key={link.label} onPress={() => router.push(link.route as any)} style={s.quickItem}>
                    <View style={s.quickIcon}>
                      <Ionicons name={link.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={s.quickLabel}>{link.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  statCard: { width: "47%", flexGrow: 1, flexShrink: 1, flexBasis: "47%", backgroundColor: colors.white, padding: 14, alignItems: "center", minWidth: 140 },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.gray900, marginBottom: 2 },
  statLabel: { fontSize: 11, color: colors.gray500, textAlign: "center", fontWeight: "500" },
  alertBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", marginHorizontal: 12, marginBottom: 4, padding: 14, gap: 10 },
  alertText: { flex: 1, fontSize: 13, color: "#92400e" },
  section: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  upcomingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  upcomingOrder: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  upcomingDate: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  upcomingAmount: { fontSize: 14, fontWeight: "700", color: colors.primary },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickItem: { width: "30%", flexGrow: 1, flexShrink: 1, flexBasis: "30%", alignItems: "center", paddingVertical: 14, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.gray50, gap: 6, minWidth: 100 },
  quickIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, color: colors.gray700, fontWeight: "600", textAlign: "center" },
});
