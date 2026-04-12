import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringOrdersAPI } from "@/services/api";
import { colors } from "@/theme";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#d1fae5", text: "#065f46" },
  paused: { bg: "#fef3c7", text: "#92400e" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
  completed: { bg: "#f3f4f6", text: "#374151" },
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", fortnightly: "Every 2 weeks",
  monthly: "Monthly", bimonthly: "Every 2 months", quarterly: "Quarterly",
};

export default function RecurringOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-recurring-orders", statusFilter],
    queryFn: () => recurringOrdersAPI.getMine({ status: statusFilter || undefined }),
    staleTime: 30000,
  });
  const orders = data?.data?.data || [];

  const pauseMutation = useMutation({
    mutationFn: (id: string) => recurringOrdersAPI.pause(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-recurring-orders"] }),
  });
  const resumeMutation = useMutation({
    mutationFn: (id: string) => recurringOrdersAPI.resume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-recurring-orders"] }),
  });
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => recurringOrdersAPI.cancel(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-recurring-orders"] }),
  });

  const handleCancel = (order: any) => {
    Alert.alert("Cancel Recurring Order", `Cancel recurring delivery of ${order.productName}?`, [
      { text: "Keep", style: "cancel" },
      { text: "Cancel Order", style: "destructive", onPress: () => cancelMutation.mutate({ id: order._id, reason: "Customer cancelled" }) },
    ]);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Recurring Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
        {[["", "All"], ["active", "Active"], ["paused", "Paused"], ["cancelled", "Cancelled"], ["completed", "Completed"]].map(([val, label]) => (
          <Pressable
            key={val}
            onPress={() => setStatusFilter(val)}
            style={[s.filterChip, statusFilter === val && s.filterChipActive]}
          >
            <Text style={[s.filterChipText, statusFilter === val && s.filterChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={s.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔄</Text>
          <Text style={s.emptyTitle}>No recurring orders</Text>
          <Text style={s.emptyText}>Set up a recurring purchase on any product page</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {orders.map((order: any) => {
            const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.completed;
            const nextDelivery = order.nextDeliveryDate
              ? new Date(order.nextDeliveryDate).toLocaleDateString("en-ZA")
              : null;
            return (
              <View key={order._id} style={s.card}>
                <View style={s.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.productName} numberOfLines={2}>{order.productName || "Product"}</Text>
                    <Text style={s.meta}>Qty {order.quantity} · {FREQ_LABELS[order.frequency] || order.frequency}</Text>
                    {nextDelivery && <Text style={s.meta}>📦 Next: {nextDelivery}</Text>}
                    {order.paymentMode === "upfront" && (
                      <Text style={s.meta}>{order.completedInstances}/{order.totalInstances} delivered</Text>
                    )}
                  </View>
                  <View style={[s.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[s.badgeText, { color: statusStyle.text }]}>{order.status}</Text>
                  </View>
                </View>

                {/* Upfront progress */}
                {order.paymentMode === "upfront" && order.totalInstances > 0 && (
                  <View style={s.progressTrack}>
                    <View style={[s.progressBar, { width: `${(order.completedInstances / order.totalInstances) * 100}%` as any }]} />
                  </View>
                )}

                {/* Actions */}
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <View style={s.actions}>
                    {order.status === "active" && (
                      <Pressable style={s.actionBtn} onPress={() => pauseMutation.mutate(order._id)}>
                        <Text style={s.actionBtnText}>Pause</Text>
                      </Pressable>
                    )}
                    {order.status === "paused" && (
                      <Pressable style={[s.actionBtn, s.actionBtnPrimary]} onPress={() => resumeMutation.mutate(order._id)}>
                        <Text style={[s.actionBtnText, { color: "#fff" }]}>Resume</Text>
                      </Pressable>
                    )}
                    <Pressable style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleCancel(order)}>
                      <Text style={[s.actionBtnText, { color: colors.red500 }]}>Cancel</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
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
  filterRow: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white },
  filterChipActive: { backgroundColor: colors.gray900, borderColor: colors.gray900 },
  filterChipText: { fontSize: 12, color: colors.gray700 },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.gray700 },
  emptyText: { fontSize: 13, color: colors.gray400, marginTop: 4, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.gray100 },
  cardRow: { flexDirection: "row", gap: 10 },
  productName: { fontSize: 14, fontWeight: "600", color: colors.gray900, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  progressTrack: { height: 4, backgroundColor: colors.gray100, borderRadius: 2, marginTop: 10, overflow: "hidden" },
  progressBar: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.gray300 },
  actionBtnPrimary: { backgroundColor: colors.gray900, borderColor: colors.gray900 },
  actionBtnDanger: { borderColor: "#fecaca" },
  actionBtnText: { fontSize: 13, color: colors.gray700, fontWeight: "500" },
});
