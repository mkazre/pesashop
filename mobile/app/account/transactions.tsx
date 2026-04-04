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

type Transaction = {
  _id: string;
  type: string;
  amount: number;
  description?: string;
  reference?: string;
  createdAt: string;
  laybye?: {
    order?: { orderNumber?: string };
  };
};

const TYPE_ICONS: Record<string, any> = {
  deposit:     "arrow-down-circle-outline",
  installment: "cash-outline",
  refund:      "return-up-back-outline",
  adjustment:  "swap-horizontal-outline",
  penalty:     "alert-circle-outline",
  cancellation:"close-circle-outline",
};

const TYPE_COLORS: Record<string, string> = {
  deposit:     "#16a34a",
  installment: "#0f604b",
  refund:      "#2563eb",
  adjustment:  "#7c3aed",
  penalty:     "#dc2626",
  cancellation:"#dc2626",
};

export default function TransactionsScreen() {
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await laybyAPI.getMyTransactions();
        const data: Transaction[] = res?.data?.data || res?.data || [];
        setTransactions(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const typeLabel = (type: string) =>
    type ? type.charAt(0).toUpperCase() + type.slice(1) : "Transaction";

  return (
    <View style={s.screen}>
      <ScreenHeader title="Transaction History" showBack />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="list-outline" size={48} color={colors.gray300} />
            <Text style={s.emptyTitle}>No Transactions Yet</Text>
            <Text style={s.emptyText}>Your laybye transaction history will appear here.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {transactions.map((t) => {
              const icon = TYPE_ICONS[t.type] || "swap-horizontal-outline";
              const color = TYPE_COLORS[t.type] || colors.gray500;
              const orderNum = t.laybye?.order?.orderNumber;
              return (
                <View key={t._id} style={s.card}>
                  <View style={[s.iconWrap, { backgroundColor: color + "15" }]}>
                    <Ionicons name={icon} size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.row}>
                      <Text style={s.typeLabel}>{typeLabel(t.type)}</Text>
                      <Text style={[s.amount, { color }]}>
                        {t.type === "refund" || t.type === "adjustment" ? "" : ""}
                        {formatPrice(t.amount)}
                      </Text>
                    </View>
                    {t.description && (
                      <Text style={s.desc} numberOfLines={2}>{t.description}</Text>
                    )}
                    {orderNum && (
                      <Text style={s.sub}>Order #{orderNum}</Text>
                    )}
                    {t.reference && (
                      <Text style={s.sub}>Ref: {t.reference}</Text>
                    )}
                    <Text style={s.date}>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </Text>
                  </View>
                </View>
              );
            })}
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
  card: { backgroundColor: colors.white, padding: 16, flexDirection: "row", gap: 14, alignItems: "flex-start" },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  typeLabel: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  amount: { fontSize: 15, fontWeight: "800" },
  desc: { fontSize: 12, color: colors.gray600, marginBottom: 2 },
  sub: { fontSize: 11, color: colors.gray400 },
  date: { fontSize: 11, color: colors.gray400, marginTop: 4 },
});
