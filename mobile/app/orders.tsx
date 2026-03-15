import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { ordersAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

const statusColorMap: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef9c3", text: "#a16207" },
  processing: { bg: "#dbeafe", text: "#1d4ed8" },
  shipped: { bg: "#f3e8ff", text: "#7e22ce" },
  delivered: { bg: "#dcfce7", text: "#15803d" },
  cancelled: { bg: "#fee2e2", text: "#b91c1c" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  useEffect(() => {
    ordersAPI.getAll({ sort: "-createdAt" }).then((res) => setOrders(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={os.screen}>
      <ScreenHeader title="My Orders" showBack />
      {orders.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" message="Your orders will appear here" actionLabel="Start Shopping" onAction={() => router.push("/shop" as any)} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }: any) => {
            const sc = statusColorMap[item.status] || { bg: colors.gray100, text: colors.gray700 };
            return (
              <Pressable onPress={() => router.push(`/order/${item._id}` as any)} style={os.card}>
                <View style={os.cardHeader}>
                  <Text style={os.orderNum}>#{item.orderNumber || item._id.slice(-8)}</Text>
                  <View style={[os.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[os.badgeText, { color: sc.text }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={os.date}>
                  {new Date(item.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                </Text>
                <View style={os.cardFooter}>
                  <Text style={os.itemCount}>{item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? "s" : ""}</Text>
                  <Text style={os.total}>{formatPrice(item.total || 0)}</Text>
                </View>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <BottomTabBar />
    </View>
  );
}

const os = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  card: { backgroundColor: colors.white, borderRadius: 0, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray100 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  orderNum: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  badge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 0 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  date: { fontSize: 12, color: colors.gray500, marginBottom: 4 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  itemCount: { fontSize: 12, color: colors.gray500 },
  total: { fontSize: 14, fontWeight: "700", color: colors.primary },
});
