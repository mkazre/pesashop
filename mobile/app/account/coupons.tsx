import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Clipboard,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { couponsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import BottomTabBar from "@/components/BottomTabBar";
import { colors } from "@/theme";

export default function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await couponsAPI.getMyCoupons();
      const d = res.data?.data || {};
      const available = d.available || [];
      const used = d.used || [];
      setCoupons([...available, ...used]);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, []);

  const isExpired = (coupon: any) => {
    const expiry = coupon.expiryDate || coupon.endDate;
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={colors.gray800} /></Pressable>
          <Text style={s.headerTitle}>My Coupons</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={colors.gray800} /></Pressable>
        <Text style={s.headerTitle}>My Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCoupons(); }} />}
      >
        {coupons.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color={colors.gray300} />
            <Text style={s.emptyText}>No coupons available</Text>
            <Text style={s.emptySub}>Keep shopping to earn exclusive coupons!</Text>
          </View>
        ) : (
          coupons.map((coupon: any) => {
            const expired = isExpired(coupon);
            return (
              <View key={coupon._id} style={[s.card, expired && s.cardExpired]}>
                <View style={s.cardLeft}>
                  <View style={[s.discountBox, expired && { backgroundColor: colors.gray400 }]}>
                    <Text style={s.discountValue}>
                      {(coupon.discountType || coupon.type) === "percentage"
                        ? `${coupon.discountValue || coupon.value}%`
                        : formatPrice(coupon.discountValue || coupon.value)}
                    </Text>
                    <Text style={s.discountLabel}>OFF</Text>
                  </View>
                </View>
                <View style={s.cardRight}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[s.couponCode, expired && { color: colors.gray400 }]}>{coupon.code}</Text>
                    <Pressable
                      onPress={() => { Clipboard.setString(coupon.code); Toast.show({ type: "success", text1: "Coupon code copied!", visibilityTime: 1500 }); }}
                      style={s.copyBtn}
                    >
                      <Ionicons name="copy-outline" size={14} color={colors.primary} />
                    </Pressable>
                  </View>
                  {coupon.description && <Text style={s.couponDesc} numberOfLines={2}>{coupon.description}</Text>}
                  <View style={s.metaRow}>
                    {(coupon.minimumOrderAmount || coupon.minimumAmount) > 0 && (
                      <Text style={s.metaText}>Min. {formatPrice(coupon.minimumOrderAmount || coupon.minimumAmount)}</Text>
                    )}
                    {(coupon.expiryDate || coupon.endDate) && (
                      <Text style={[s.metaText, expired && { color: colors.red500 }]}>
                        {expired ? "Expired" : `Exp: ${new Date(coupon.expiryDate || coupon.endDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}`}
                      </Text>
                    )}
                  </View>
                  {coupon.usageLimitPerUser && (
                    <Text style={s.usageText}>
                      Used {coupon.userUsageCount || 0} / {coupon.usageLimitPerUser} times
                    </Text>
                  )}
                </View>
              </View>
            );
          })
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
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  card: { flexDirection: "row", backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: colors.gray200, overflow: "hidden" },
  cardExpired: { opacity: 0.6 },
  cardLeft: { padding: 12, justifyContent: "center", alignItems: "center" },
  discountBox: { backgroundColor: colors.primary, width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  discountValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  discountLabel: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700" },
  cardRight: { flex: 1, padding: 12, justifyContent: "center" },
  couponCode: { fontSize: 16, fontWeight: "700", color: colors.gray900, letterSpacing: 1 },
  couponDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  metaText: { fontSize: 11, color: colors.gray500 },
  usageText: { fontSize: 10, color: colors.gray400, marginTop: 4 },
  copyBtn: { padding: 5, backgroundColor: colors.primaryLight, borderRadius: 2 },
});
