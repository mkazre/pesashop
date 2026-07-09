import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { invoicesAPI, viewInvoicePDF } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

export default function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await invoicesAPI.getMine();
      setInvoices(res.data?.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const open = async (inv: any) => {
    setOpeningId(inv.orderId);
    try {
      await viewInvoicePDF(inv.orderId, inv.invoiceNumber);
    } catch {
      Toast.show({ type: "error", text1: "Failed to open invoice" });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>My Invoices</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        >
          {invoices.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyTitle}>No invoices yet</Text>
            </View>
          ) : (
            invoices.map((inv: any) => (
              <View key={inv.orderId} style={s.card}>
                <View style={{ flex: 1 }}>
                  <Text style={s.invNum}>{inv.invoiceNumber}</Text>
                  <Text style={s.invMeta}>Order {inv.orderNumber} · {new Date(inv.createdAt).toLocaleDateString("en-ZA")}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={s.invTotal}>{formatPrice(inv.total || 0)}</Text>
                  <View style={[s.statusBadge, inv.paymentStatus === "completed" && s.statusBadgeGreen]}>
                    <Text style={[s.statusBadgeText, inv.paymentStatus === "completed" && s.statusBadgeTextGreen]}>
                      {inv.paymentStatus || "pending"}
                    </Text>
                  </View>
                  <Pressable onPress={() => open(inv)} disabled={openingId === inv.orderId} style={s.viewBtn}>
                    {openingId === inv.orderId ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="document-outline" size={14} color={colors.white} />
                        <Text style={s.viewBtnText}>View / Download</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },
  card: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderRadius: 12, padding: 14 },
  invNum: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  invMeta: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  invTotal: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  statusBadge: { backgroundColor: colors.gray100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusBadgeGreen: { backgroundColor: "#dcfce7" },
  statusBadgeText: { fontSize: 10, fontWeight: "600", color: colors.gray600 },
  statusBadgeTextGreen: { color: "#15803d" },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  viewBtnText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});
