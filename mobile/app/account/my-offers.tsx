import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersAPI } from "@/services/api";
import { colors } from "@/theme";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#d1fae5", text: "#065f46" },
  pending_contact: { bg: "#dbeafe", text: "#1e40af" },
  contacted: { bg: "#ede9fe", text: "#5b21b6" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
  expired: { bg: "#f3f4f6", text: "#6b7280" },
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active", pending_contact: "Awaiting Contact",
  contacted: "Contacted", cancelled: "Cancelled", expired: "Expired",
};

export default function MyOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => offersAPI.getMine(),
    staleTime: 30000,
  });
  const offers = data?.data?.data || [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => offersAPI.cancelMine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-offers"] }),
  });

  const handleCancel = (id: string, title: string) => {
    Alert.alert("Cancel Offer", `Cancel "${title}"?`, [
      { text: "Keep", style: "cancel" },
      { text: "Cancel Offer", style: "destructive", onPress: () => cancelMutation.mutate(id) },
    ]);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>My Offers</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : offers.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🏷️</Text>
          <Text style={s.emptyTitle}>No offers yet</Text>
          <Text style={s.emptyText}>Browse offers available on product pages</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {offers.map((item: any) => {
            const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.expired;
            const takenDate = item.purchaseDate || item.requestedAt
              ? new Date(item.purchaseDate || item.requestedAt).toLocaleDateString("en-ZA")
              : null;

            return (
              <View key={item._id} style={s.card}>
                <View style={s.cardRow}>
                  {item.offer?.logoUrl ? (
                    <Image source={{ uri: item.offer.logoUrl }} style={s.logo} />
                  ) : (
                    <View style={s.logoPlaceholder}><Text style={{ fontSize: 20 }}>🏷️</Text></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={s.titleRow}>
                      <Text style={s.offerTitle} numberOfLines={1}>{item.offer?.title || "Offer"}</Text>
                      <View style={[s.badge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[s.badgeText, { color: statusStyle.text }]}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Text>
                      </View>
                    </View>
                    {item.offer?.shortDescription && (
                      <Text style={s.desc} numberOfLines={2}>{item.offer.shortDescription}</Text>
                    )}
                    {takenDate && <Text style={s.meta}>Taken: {takenDate}</Text>}
                    {item.expiryDate && (
                      <Text style={s.meta}>Expires: {new Date(item.expiryDate).toLocaleDateString("en-ZA")}</Text>
                    )}
                  </View>
                </View>

                {item.status === "pending_contact" && (
                  <View style={s.infoBox}>
                    <Text style={s.infoText}>We'll be in touch soon about this offer.</Text>
                  </View>
                )}

                {["active", "pending_contact"].includes(item.status) && (
                  <Pressable style={s.cancelBtn} onPress={() => handleCancel(item._id, item.offer?.title || "offer")}>
                    <Text style={s.cancelBtnText}>Cancel Offer</Text>
                  </Pressable>
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
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.gray700 },
  emptyText: { fontSize: 13, color: colors.gray400, marginTop: 4, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.gray100 },
  cardRow: { flexDirection: "row", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.gray100 },
  logoPlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, flex: 1 },
  offerTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.gray900 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  desc: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  meta: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  infoBox: { backgroundColor: "#eff6ff", borderRadius: 8, padding: 10, marginTop: 10 },
  infoText: { fontSize: 12, color: "#1d4ed8" },
  cancelBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, alignSelf: "flex-start" },
  cancelBtnText: { fontSize: 12, color: colors.red500, fontWeight: "500" },
});
