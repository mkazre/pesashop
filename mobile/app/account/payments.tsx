import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import BottomTabBar from "@/components/BottomTabBar";
import { laybyAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

type Payment = {
  _id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  type?: string;
  reference?: string;
  laybyeOrderNumber?: string;
};

export default function PaymentsScreen() {
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await laybyAPI.getMyLaybyes();
        const laybyes: any[] = res?.data?.data || res?.data || [];
        const all: Payment[] = [];
        laybyes.forEach((laybye: any) => {
          (laybye.payments || []).forEach((p: any) => {
            all.push({
              _id: p._id,
              amount: p.amount || 0,
              method: p.method || "—",
              status: p.status || "pending",
              createdAt: p.createdAt || p.date || "",
              type: p.type,
              reference: p.reference,
              laybyeOrderNumber: laybye.order?.orderNumber,
            });
          });
        });
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(all);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statusColor = (status: string) => {
    if (status === "completed") return "#16a34a";
    if (status === "pending") return "#d97706";
    if (status === "failed") return "#dc2626";
    return colors.gray500;
  };

  const statusBg = (status: string) => {
    if (status === "completed") return "#f0fdf4";
    if (status === "pending") return "#fffbeb";
    if (status === "failed") return "#fef2f2";
    return colors.gray50;
  };

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      eft: "EFT / Bank Transfer",
      cash: "Cash",
      card: "Card",
      online: "Online",
      store_credit: "Store Credit",
    };
    return map[method] || method;
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Payment History" showBack />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : payments.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="cash-outline" size={48} color={colors.gray300} />
            <Text style={s.emptyTitle}>No Payments Yet</Text>
            <Text style={s.emptyText}>Your laybye payments will appear here.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {payments.map((p) => (
              <View key={p._id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.orderNum}>
                      {p.laybyeOrderNumber ? `Order #${p.laybyeOrderNumber}` : "Laybye Payment"}
                    </Text>
                    <Text style={s.meta}>
                      {p.type ? `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} · ` : ""}
                      {methodLabel(p.method)}
                    </Text>
                    <Text style={s.date}>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.amount}>{formatPrice(p.amount)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: statusBg(p.status) }]}>
                      <Text style={[s.statusText, { color: statusColor(p.status) }]}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                {p.reference && (
                  <Text style={s.ref}>Ref: {p.reference}</Text>
                )}
              </View>
            ))}
          </View>
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
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray700 },
  emptyText: { fontSize: 13, color: colors.gray500, textAlign: "center", paddingHorizontal: 32 },
  list: { paddingHorizontal: 12, paddingTop: 12, gap: 10 },
  card: { backgroundColor: colors.white, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  orderNum: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 2 },
  meta: { fontSize: 12, color: colors.gray600, marginBottom: 2 },
  date: { fontSize: 12, color: colors.gray400 },
  amount: { fontSize: 16, fontWeight: "800", color: colors.primary, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  ref: { fontSize: 11, color: colors.gray400, marginTop: 8 },
});
