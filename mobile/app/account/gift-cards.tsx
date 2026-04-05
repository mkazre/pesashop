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
import { giftCardsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import BottomTabBar from "@/components/BottomTabBar";
import { colors } from "@/theme";

export default function GiftCardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [giftCards, setGiftCards] = useState<any[]>([]);

  const fetchGiftCards = useCallback(async () => {
    try {
      const res = await giftCardsAPI.getMyGiftCards();
      const d = res.data?.data || {};
      const purchased = d.purchased || [];
      const received = d.received || [];
      setGiftCards([...purchased, ...received]);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchGiftCards(); }, []);

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={colors.gray800} /></Pressable>
          <Text style={s.headerTitle}>Gift Cards</Text>
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
        <Text style={s.headerTitle}>Gift Cards</Text>
        <Pressable onPress={() => router.push("/account/buy-gift-card" as any)} style={s.buyBtn}>
          <Text style={s.buyBtnText}>Buy Gift Card</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGiftCards(); }} />}
      >
        {giftCards.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="gift-outline" size={48} color={colors.gray300} />
            <Text style={s.emptyText}>No gift cards</Text>
            <Text style={s.emptySub}>Purchase or receive gift cards to see them here</Text>
          </View>
        ) : (
          giftCards.map((gc: any) => {
            const isPendingPayment = gc.paymentStatus === 'pending_payment';
            const isActive = !isPendingPayment && (gc.isActive !== false) && (gc.currentBalance || gc.balance) > 0;
            return (
              <View key={gc._id} style={[s.card, !isActive && { opacity: 0.6 }]}>
                <View style={s.cardGradient}>
                  <Ionicons name="gift" size={24} color="rgba(255,255,255,0.8)" />
                  <Text style={s.cardBalance}>{formatPrice(gc.currentBalance || gc.balance || 0)}</Text>
                  <Text style={s.cardBalLabel}>Balance</Text>
                </View>
                <View style={s.cardBody}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Text style={[s.cardCode, { marginBottom: 0 }]}>{gc.code}</Text>
                    <Pressable
                      onPress={() => { Clipboard.setString(gc.code); Toast.show({ type: "success", text1: "Gift card code copied!", visibilityTime: 1500 }); }}
                      style={s.copyBtn}
                    >
                      <Ionicons name="copy-outline" size={14} color={colors.primary} />
                    </Pressable>
                  </View>
                  <View style={s.cardRow}>
                    <View>
                      <Text style={s.cardMetaLabel}>Original Value</Text>
                      <Text style={s.cardMetaValue}>{formatPrice(gc.initialBalance || gc.amount || gc.currentBalance || 0)}</Text>
                    </View>
                    <View>
                      <Text style={s.cardMetaLabel}>Status</Text>
                      <Text style={[s.cardMetaValue, { color: isPendingPayment ? colors.amber500 : isActive ? colors.green600 : colors.gray500, textTransform: "capitalize" }]}>{isPendingPayment ? "Awaiting Payment" : gc.isRedeemed ? "Redeemed" : isActive ? "Active" : "Expired"}</Text>
                    </View>
                    {gc.expiresAt && (
                      <View>
                        <Text style={s.cardMetaLabel}>Expires</Text>
                        <Text style={s.cardMetaValue}>
                          {new Date(gc.expiresAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                        </Text>
                      </View>
                    )}
                  </View>
                  {gc.recipientName && (
                    <Text style={s.recipientText}>To: {gc.recipientName} ({gc.recipientEmail})</Text>
                  )}
                  {gc.senderName && (
                    <Text style={s.recipientText}>From: {gc.senderName}</Text>
                  )}
                  {gc.message && (
                    <Text style={s.messageText}>"{gc.message}"</Text>
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
  card: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: colors.gray200, overflow: "hidden" },
  cardGradient: { backgroundColor: colors.primary, padding: 20, alignItems: "center" },
  cardBalance: { fontSize: 28, fontWeight: "800", color: "#fff", marginTop: 8 },
  cardBalLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  cardBody: { padding: 16 },
  cardCode: { fontSize: 16, fontWeight: "700", color: colors.gray900, letterSpacing: 2 },
  copyBtn: { padding: 6, backgroundColor: colors.primaryLight },
  buyBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7 },
  buyBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardMetaLabel: { fontSize: 10, color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5 },
  cardMetaValue: { fontSize: 13, fontWeight: "600", color: colors.gray900, marginTop: 2 },
  recipientText: { fontSize: 12, color: colors.gray500, marginTop: 8 },
  messageText: { fontSize: 12, color: colors.gray600, fontStyle: "italic", marginTop: 4 },
});
