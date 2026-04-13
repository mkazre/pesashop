import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { serviceRequestsAPI } from "@/services/api";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "#fef9c3", text: "#854d0e" },
  assigned:  { bg: "#dbeafe", text: "#1e40af" },
  scheduled: { bg: "#ede9fe", text: "#6d28d9" },
  completed: { bg: "#dcfce7", text: "#166534" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function ServiceRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceRequestsAPI.getMine()
      .then((res) => setRequests(res.data?.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.title}>My Service Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="construct-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyTitle}>No service requests yet</Text>
              <Text style={s.emptySub}>Browse products to request a professional service</Text>
              <Pressable onPress={() => router.push("/(tabs)/shop" as any)} style={s.emptyBtn}>
                <Text style={s.emptyBtnText}>Browse Products</Text>
              </Pressable>
            </View>
          ) : (
            requests.map((req) => {
              const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
              return (
                <View key={req._id} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardService}>{req.serviceType?.title || "Service Request"}</Text>
                    <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.statusText, { color: sc.text }]}>{req.status?.toUpperCase()}</Text>
                    </View>
                  </View>
                  {req.productName && (
                    <Text style={s.cardProduct}>Product: {req.productName}</Text>
                  )}
                  {(req.serviceModes || []).length > 0 && (
                    <Text style={s.cardModes}>{req.serviceModes.join(" · ")}</Text>
                  )}
                  {req.description && (
                    <Text style={s.cardDesc} numberOfLines={2}>{req.description}</Text>
                  )}
                  {req.assignedProvider && (
                    <View style={s.providerRow}>
                      <Ionicons name="person-circle-outline" size={14} color={colors.gray500} />
                      <Text style={s.providerText}>{req.assignedProvider.businessName || req.assignedProvider.contactName}</Text>
                    </View>
                  )}
                  {req.scheduledDate && (
                    <View style={s.providerRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.gray500} />
                      <Text style={s.providerText}>Scheduled: {new Date(req.scheduledDate).toLocaleDateString()}</Text>
                    </View>
                  )}
                  <Text style={s.cardDate}>{new Date(req.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  content: { padding: 16, paddingBottom: 80 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray700, marginTop: 16 },
  emptySub: { fontSize: 13, color: colors.gray500, textAlign: "center", marginTop: 8 },
  emptyBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 0 },
  emptyBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  card: { backgroundColor: colors.white, borderRadius: 0, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray100 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  cardService: { fontSize: 15, fontWeight: "700", color: colors.gray900, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardProduct: { fontSize: 12, color: colors.gray600, marginBottom: 3 },
  cardModes: { fontSize: 11, color: colors.gray500, marginBottom: 4, textTransform: "capitalize" },
  cardDesc: { fontSize: 12, color: colors.gray600, marginBottom: 6, lineHeight: 18 },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  providerText: { fontSize: 12, color: colors.gray600 },
  cardDate: { fontSize: 11, color: colors.gray400, marginTop: 6 },
});
