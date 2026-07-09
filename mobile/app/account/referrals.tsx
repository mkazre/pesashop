import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Clipboard,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { referralsAPI } from "@/services/api";
import { colors } from "@/theme";

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await referralsAPI.getMine();
      setData(res.data?.data || res.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const copyLink = () => {
    if (!data?.shareUrl) return;
    Clipboard.setString(data.shareUrl);
    Toast.show({ type: "success", text1: "Link copied!", visibilityTime: 1500 });
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await referralsAPI.invite({ email: inviteEmail.trim(), channel: "email" });
      Toast.show({ type: "success", text1: "Invite sent!" });
      setInviteEmail("");
      fetchData();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Failed to send invite" });
    } finally {
      setInviting(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <Header router={router} />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>Your referral code</Text>
          <Text style={s.heroCode}>{data.code}</Text>
          <Text style={s.heroUrl} numberOfLines={1}>{data.shareUrl}</Text>
          <View style={s.heroBtnRow}>
            <Pressable onPress={copyLink} style={s.copyBtn}>
              <Text style={s.copyBtnText}>Copy link</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(data.whatsappShareUrl)} style={s.waBtn}>
              <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
              <Text style={s.waBtnText}>Share on WhatsApp</Text>
            </Pressable>
          </View>
          <Text style={s.tierText}>Tier: <Text style={{ fontWeight: "700" }}>{data.tier?.label}</Text> ({data.tier?.multiplier}× rewards)</Text>
        </View>

        <View style={s.statsGrid}>
          <Stat label="Sent" value={data.summary?.sent ?? 0} />
          <Stat label="Signed up" value={data.summary?.signedUp ?? 0} />
          <Stat label="Purchased" value={data.summary?.qualified ?? 0} />
          <Stat label="Coins earned" value={data.summary?.pointsEarned ?? 0} />
        </View>

        <View style={s.inviteBox}>
          <Text style={s.inviteTitle}>Invite by email</Text>
          <View style={s.inviteRow}>
            <TextInput
              style={s.inviteInput}
              placeholder="friend@email.com"
              placeholderTextColor={colors.gray400}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable onPress={sendInvite} disabled={!inviteEmail.trim() || inviting} style={[s.sendBtn, (!inviteEmail.trim() || inviting) && { opacity: 0.5 }]}>
              <Text style={s.sendBtnText}>{inviting ? "..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.sectionTitle}>Invite history</Text>
        {(data.referrals || []).length === 0 ? (
          <Text style={s.emptyText}>No invites yet. Share your code above to get started.</Text>
        ) : (
          data.referrals.map((inv: any) => (
            <View key={inv._id} style={s.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.historyName}>{inv.referee?.firstName || inv.refereeEmail || "Pending"}</Text>
                <Text style={s.historyDate}>{new Date(inv.createdAt).toLocaleDateString("en-ZA")}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <View style={[s.statusBadge, (inv.status === "rewarded" || inv.status === "qualified") && s.statusBadgeGreen]}>
                  <Text style={[s.statusBadgeText, (inv.status === "rewarded" || inv.status === "qualified") && s.statusBadgeTextGreen]}>
                    {(inv.status || "").replace(/_/g, " ")}
                  </Text>
                </View>
                {inv.referrerBonusPoints > 0 && <Text style={s.bonusText}>+{inv.referrerBonusPoints} coins</Text>}
              </View>
            </View>
          ))
        )}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function Header({ router }: { router: any }) {
  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.gray800} />
      </Pressable>
      <Text style={s.headerTitle}>Invite & Earn</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={s.statCard}>
    <Text style={s.statValue}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
  heroLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  heroCode: { color: colors.white, fontSize: 30, fontWeight: "800", letterSpacing: 3, marginVertical: 6 },
  heroUrl: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 14 },
  heroBtnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  copyBtn: { backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  copyBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#25D366", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  waBtnText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  tierText: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderRadius: 12, padding: 14, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  inviteBox: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, padding: 14, marginBottom: 20 },
  inviteTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  inviteRow: { flexDirection: "row", gap: 8 },
  inviteInput: { flex: 1, borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.gray900 },
  sendBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  emptyText: { fontSize: 13, color: colors.gray400 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 8 },
  historyName: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  historyDate: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  statusBadge: { backgroundColor: colors.gray100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusBadgeGreen: { backgroundColor: "#dcfce7" },
  statusBadgeText: { fontSize: 10, fontWeight: "600", color: colors.gray600, textTransform: "capitalize" },
  statusBadgeTextGreen: { color: "#15803d" },
  bonusText: { fontSize: 11, color: "#15803d", marginTop: 4, fontWeight: "600" },
});
