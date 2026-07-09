import { useState, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { returnsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  requested: { bg: "#fef3c7", text: "#b45309", label: "Requested" },
  approved: { bg: "#dbeafe", text: "#1d4ed8", label: "Approved" },
  awaiting_shipment: { bg: "#dbeafe", text: "#1d4ed8", label: "Awaiting shipment" },
  received: { bg: "#e0e7ff", text: "#4338ca", label: "Received" },
  refunded: { bg: "#dcfce7", text: "#15803d", label: "Refunded" },
  rejected: { bg: "#fee2e2", text: "#dc2626", label: "Rejected" },
  closed: { bg: colors.gray100, text: colors.gray600, label: "Closed" },
  disputed: { bg: "#fee2e2", text: "#dc2626", label: "Disputed" },
};

export default function ReturnsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [disputeFor, setDisputeFor] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await returnsAPI.getMine();
      setReturns(res.data?.data || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const submitDispute = async (id: string) => {
    if (!disputeReason.trim()) return;
    setSubmittingDispute(true);
    try {
      await returnsAPI.dispute(id, disputeReason.trim());
      Toast.show({ type: "success", text1: "Dispute submitted" });
      setDisputeFor(null);
      setDisputeReason("");
      fetchData();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to open dispute" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>My Returns</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        >
          {returns.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="return-down-back-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyTitle}>No returns yet</Text>
              <Text style={s.emptyText}>Start a return from an eligible order in Your Orders.</Text>
              <Pressable onPress={() => router.push("/orders" as any)} style={s.emptyBtn}>
                <Text style={s.emptyBtnText}>Go to My Orders</Text>
              </Pressable>
            </View>
          ) : (
            returns.map((r) => {
              const status = STATUS_STYLES[r.status] || { bg: colors.gray100, text: colors.gray600, label: r.status };
              return (
                <View key={r._id} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rma}>RMA {r.rmaNumber}</Text>
                      <Text style={s.meta}>
                        Order {r.order?.orderNumber} · {new Date(r.createdAt).toLocaleDateString("en-ZA")}
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: status.bg }]}>
                      <Text style={[s.badgeText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  <Text style={s.reason}><Text style={{ fontWeight: "700" }}>Reason: </Text>{r.reason}</Text>

                  {r.items?.map((it: any, i: number) => (
                    <Text key={i} style={s.itemLine}>· {it.quantity}× {it.name} — {formatPrice(it.total || 0)}</Text>
                  ))}

                  <View style={s.refundRow}>
                    <Text style={s.refundLabel}>
                      Refund: <Text style={s.refundValue}>{formatPrice(r.refundAmount || 0)}</Text> ({(r.refundMethod || "").replace(/_/g, " ")})
                    </Text>
                    {r.refundedAt && (
                      <Text style={s.refundedDate}>Refunded {new Date(r.refundedAt).toLocaleDateString("en-ZA")}</Text>
                    )}
                  </View>

                  {r.status === "rejected" && r.rejectionReason && (
                    <View style={s.rejectionBox}>
                      <Text style={s.rejectionText}><Text style={{ fontWeight: "700" }}>Rejection reason: </Text>{r.rejectionReason}</Text>
                      {disputeFor !== r._id && (
                        <Pressable onPress={() => setDisputeFor(r._id)}>
                          <Text style={s.disputeLink}>Dispute this</Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {disputeFor === r._id && (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      <TextInput
                        style={s.disputeInput}
                        placeholder="Why are you disputing this rejection?"
                        placeholderTextColor={colors.gray400}
                        multiline
                        value={disputeReason}
                        onChangeText={setDisputeReason}
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable
                          onPress={() => submitDispute(r._id)}
                          disabled={submittingDispute || !disputeReason.trim()}
                          style={[s.disputeSubmitBtn, (submittingDispute || !disputeReason.trim()) && { opacity: 0.5 }]}
                        >
                          <Text style={s.disputeSubmitText}>{submittingDispute ? "Submitting..." : "Submit dispute"}</Text>
                        </Pressable>
                        <Pressable onPress={() => { setDisputeFor(null); setDisputeReason(""); }} style={s.disputeCancelBtn}>
                          <Text style={s.disputeCancelText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
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
  empty: { alignItems: "center", paddingVertical: 64, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray700, marginTop: 12 },
  emptyText: { fontSize: 13, color: colors.gray400, marginTop: 4, textAlign: "center" },
  emptyBtn: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.gray100 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  rma: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  meta: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  reason: { fontSize: 13, color: colors.gray700, marginBottom: 6 },
  itemLine: { fontSize: 12, color: colors.gray600, marginBottom: 2 },
  refundRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 8, paddingTop: 8 },
  refundLabel: { fontSize: 12, color: colors.gray700 },
  refundValue: { fontWeight: "700", color: colors.gray900 },
  refundedDate: { fontSize: 11, color: colors.green600 },
  rejectionBox: { marginTop: 10, backgroundColor: "#fff1f2", borderRadius: 8, padding: 10 },
  rejectionText: { fontSize: 12, color: "#be123c" },
  disputeLink: { fontSize: 12, color: "#be123c", textDecorationLine: "underline", marginTop: 6, fontWeight: "600" },
  disputeInput: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, padding: 10, fontSize: 13, color: colors.gray900, minHeight: 64, textAlignVertical: "top" },
  disputeSubmitBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  disputeSubmitText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  disputeCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  disputeCancelText: { color: colors.gray500, fontSize: 12, fontWeight: "600" },
});
