import { useState } from "react";
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
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { referralsAPI, loyaltyAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

// Mirrors ReferralsPage.jsx's LEVEL_COLORS — same rotation, just RN-friendly
// hex pairs instead of Tailwind classes.
const LEVEL_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { bg: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
  { bg: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" },
  { bg: "#fdf2f8", border: "#fbcfe8", text: "#be185d" },
  { bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  { bg: "#f0fdfa", border: "#99f6e4", text: "#0f766e" },
  { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" },
  { bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490" },
  { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
  { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
];

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { formatPrice } = useCurrencyStore();
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: refRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => referralsAPI.getMine(),
  });
  const { data: loyaltyRes } = useQuery({
    queryKey: ["loyalty-public-settings"],
    queryFn: () => loyaltyAPI.getPublicSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const invite = useMutation({
    mutationFn: (email: string) => referralsAPI.invite({ email, channel: "email" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-referrals"] });
      setInviteEmail("");
      Toast.show({ type: "success", text1: "Invite sent!" });
    },
    onError: (err: any) => {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Failed to send invite" });
    },
  });

  const data = refRes?.data?.data;
  const redemptionRate = loyaltyRes?.data?.data?.redemptionRate || 0;
  const cash = (points: number) => formatPrice(points * redemptionRate);

  const copyLink = () => {
    if (!data?.shareUrl) return;
    Clipboard.setString(data.shareUrl);
    Toast.show({ type: "success", text1: "Link copied!", visibilityTime: 1500 });
  };

  if (isLoading || !data) {
    if (isError) {
      return (
        <View style={[s.screen, { paddingTop: insets.top }]}>
          <Header router={router} />
          <View style={[s.center, { padding: 24 }]}>
            <Text style={s.errorTitle}>Couldn't load your referral dashboard</Text>
            <Text style={s.errorText}>{(error as any)?.response?.data?.message || (error as any)?.message || "Something went wrong. Please try again."}</Text>
            <Pressable onPress={() => refetch()} style={s.retryBtn}>
              <Text style={s.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  const trendUp = (data.pointsThisMonth || 0) >= (data.pointsLastMonth || 0);
  const trendDiff = data.pointsLastMonth > 0
    ? Math.round(((data.pointsThisMonth - data.pointsLastMonth) / data.pointsLastMonth) * 100)
    : (data.pointsThisMonth > 0 ? 100 : 0);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <Header router={router} />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>Share your code. You earn PESA Coins across multiple levels — not just your direct invites, but their invites too, forever.</Text>

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
        </View>

        <View style={s.widgetGrid}>
          <WidgetCard
            label="Spendable PESA Coins"
            value={(data.spendableBalance ?? 0).toLocaleString()}
            sub={redemptionRate ? `Worth ${cash(data.spendableBalance ?? 0)} — usable now` : "Usable on any purchase now"}
            color="#b45309"
          />
          <WidgetCard
            label="Lifetime referral coins"
            value={(data.totalMlmPoints ?? 0).toLocaleString()}
            sub={redemptionRate ? cash(data.totalMlmPoints ?? 0) : null}
            color="#4338ca"
          />
          <WidgetCard
            label="This month"
            value={(data.pointsThisMonth ?? 0).toLocaleString()}
            sub={(data.pointsLastMonth > 0 || data.pointsThisMonth > 0) ? `${trendUp ? "▲" : "▼"} ${Math.abs(trendDiff)}% vs last month` : "No activity yet"}
            color={trendUp ? "#15803d" : "#dc2626"}
          />
          <WidgetCard
            label="Your network"
            value={(data.networkSize ?? 0).toLocaleString()}
            sub={`Rank #${data.rank ?? "-"} among all earners`}
            color="#1d4ed8"
          />
        </View>

        <View style={s.statsGrid}>
          <Stat label="Invites sent" value={data.summary?.sent ?? 0} />
          <Stat label="Signed up" value={data.summary?.signedUp ?? 0} />
          <Stat label="Made a purchase" value={data.summary?.qualified ?? 0} />
          <Stat label="Levels active" value={(data.levelBreakdown || []).length} />
        </View>

        <EarningPotential redemptionRate={redemptionRate} cash={cash} />

        {(data.levelBreakdown || []).length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Your actual earnings by level</Text>
            <Text style={s.cardHint}>Level 1 = people you directly referred. Level 2 = people they referred, and so on — you earn from every level PesaShop has enabled.</Text>
            {data.levelBreakdown.map((lvl: any) => {
              const total = (lvl.signupPoints || 0) + (lvl.purchasePoints || 0);
              return (
                <View key={lvl.level} style={s.levelRow}>
                  <Text style={s.levelRowLabel}>Level {lvl.level}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.levelRowSub}>{lvl.signupCount} signups · {lvl.purchaseCount} purchases</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.levelRowCoins}>{total} coins</Text>
                    {redemptionRate > 0 && <Text style={s.levelRowCash}>{cash(total)}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <NetworkTree />

        <View style={s.card}>
          <Text style={s.cardTitle}>Invite by email</Text>
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
            <Pressable onPress={() => invite.mutate(inviteEmail.trim())} disabled={!inviteEmail.trim() || invite.isPending} style={[s.sendBtn, (!inviteEmail.trim() || invite.isPending) && { opacity: 0.5 }]}>
              <Text style={s.sendBtnText}>{invite.isPending ? "..." : "Send"}</Text>
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

        <RewardLedger />

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function EarningPotential({ redemptionRate, cash }: { redemptionRate: number; cash: (n: number) => string }) {
  const { data } = useQuery({
    queryKey: ["referral-levels-public"],
    queryFn: () => referralsAPI.getLevels(),
    staleTime: 5 * 60 * 1000,
  });
  const info = data?.data?.data;

  if (!info?.enabled || !info.levels?.length) return null;

  return (
    <View style={s.potentialCard}>
      <Text style={s.cardTitle}>💰 What you can earn at every level</Text>
      <Text style={s.cardHint}>The deeper your network grows, the more levels start paying you — every signup and every purchase, at every level, forever.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {info.levels.map((lvl: any, i: number) => {
          const c = LEVEL_COLORS[i % LEVEL_COLORS.length];
          return (
            <View key={lvl.level} style={[s.potentialTile, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[s.potentialLevel, { color: c.text }]}>LEVEL {lvl.level}</Text>
              <Text style={s.potentialValue}>{lvl.signupPoints} coins</Text>
              <Text style={s.potentialSub}>per signup</Text>
              <Text style={[s.potentialValue, { marginTop: 6 }]}>
                {lvl.purchaseRewardType === "percentage" ? `${lvl.purchaseRewardValue}%` : `${lvl.purchaseRewardValue} coins`}
              </Text>
              <Text style={s.potentialSub}>per purchase</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function NetworkTree() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["my-referral-network"],
    queryFn: () => referralsAPI.getMyNetwork(),
  });
  const info = data?.data?.data;

  if (isLoading) return null;

  if (!info || info.totalNetworkSize === 0) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>Your network</Text>
        <Text style={s.emptyText}>Nobody in your downline yet — share your code above to start building your network.</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Your network ({info.totalNetworkSize} {info.totalNetworkSize === 1 ? "person" : "people"})</Text>
      <Text style={s.cardHint}>Everyone in your downline, grouped by how many hops removed they are from you.</Text>
      {info.levels.map((lvl: any, i: number) => {
        const c = LEVEL_COLORS[i % LEVEL_COLORS.length];
        const isOpen = !!expanded[lvl.level];
        return (
          <View key={lvl.level} style={[s.networkLevelBox, { backgroundColor: c.bg, borderColor: c.border }]}>
            <Pressable
              onPress={() => setExpanded((e) => ({ ...e, [lvl.level]: !e[lvl.level] }))}
              style={s.networkLevelHeader}
            >
              <Text style={[s.networkLevelTitle, { color: c.text }]}>Level {lvl.level} — {lvl.count} {lvl.count === 1 ? "person" : "people"}</Text>
              <Text style={[s.networkLevelToggle, { color: c.text }]}>{isOpen ? "−" : "+"}</Text>
            </Pressable>
            {isOpen && (
              <View style={s.networkMembers}>
                {lvl.members.map((m: any) => (
                  <View key={m._id} style={s.networkMemberRow}>
                    <Text style={s.networkMemberName}>{m.firstName} {m.lastName?.charAt(0) || ""}.</Text>
                    <Text style={s.networkMemberDate}>{new Date(m.joinedAt).toLocaleDateString("en-ZA")}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function RewardLedger() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["my-referral-ledger", page],
    queryFn: () => referralsAPI.getMyLedger({ page, limit: 15 }),
  });
  const rows = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <View>
      <Text style={s.sectionTitle}>Reward history</Text>
      {isLoading && <Text style={s.emptyText}>Loading...</Text>}
      {!isLoading && rows.length === 0 && <Text style={s.emptyText}>No reward history yet — it'll show up here as your network signs up and buys.</Text>}
      {rows.map((row: any) => (
        <View key={row._id} style={s.historyRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.historyName}>
              Level {row.level} {row.eventType === "signup" ? "signup bonus" : "purchase reward"}
              {row.sourceUser && <Text style={s.ledgerFrom}> — from {row.sourceUser.firstName}</Text>}
            </Text>
            <Text style={s.historyDate}>
              {new Date(row.createdAt).toLocaleDateString("en-ZA")}
              {row.order?.orderNumber ? ` · Order ${row.order.orderNumber}` : ""}
            </Text>
          </View>
          <Text style={s.ledgerPoints}>+{row.pointsAwarded}</Text>
        </View>
      ))}
      {pagination && pagination.pages > 1 && (
        <View style={s.pagerRow}>
          <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)} style={[s.pagerBtn, page <= 1 && s.pagerBtnDisabled]}>
            <Text style={s.pagerBtnText}>Previous</Text>
          </Pressable>
          <Text style={s.pagerLabel}>Page {page} of {pagination.pages}</Text>
          <Pressable disabled={page >= pagination.pages} onPress={() => setPage((p) => p + 1)} style={[s.pagerBtn, page >= pagination.pages && s.pagerBtnDisabled]}>
            <Text style={s.pagerBtnText}>Next</Text>
          </Pressable>
        </View>
      )}
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

const WidgetCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string | null; color: string }) => (
  <View style={s.widgetCard}>
    <Text style={s.widgetLabel}>{label}</Text>
    <Text style={[s.widgetValue, { color }]}>{value}</Text>
    {sub ? <Text style={s.widgetSub}>{sub}</Text> : null}
  </View>
);

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
  errorTitle: { fontSize: 14, fontWeight: "700", color: "#b91c1c", marginBottom: 6, textAlign: "center" },
  errorText: { fontSize: 12, color: "#b91c1c", textAlign: "center", marginBottom: 12 },
  retryBtn: { backgroundColor: "#dc2626", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryBtnText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  subtitle: { fontSize: 12, color: colors.gray500, marginBottom: 14, lineHeight: 17 },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
  heroLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  heroCode: { color: colors.white, fontSize: 30, fontWeight: "800", letterSpacing: 3, marginVertical: 6 },
  heroUrl: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 14 },
  heroBtnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  copyBtn: { backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  copyBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#25D366", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  waBtnText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  widgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  widgetCard: { width: "47%", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderRadius: 12, padding: 14 },
  widgetLabel: { fontSize: 11, color: colors.gray500, marginBottom: 4 },
  widgetValue: { fontSize: 20, fontWeight: "800" },
  widgetSub: { fontSize: 10, color: colors.gray400, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderRadius: 12, padding: 14, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.gray900 },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, padding: 14, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 6 },
  cardHint: { fontSize: 11, color: colors.gray500, marginBottom: 10, lineHeight: 15 },
  potentialCard: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "#fde68a", backgroundColor: "#fffbeb", borderRadius: 12, padding: 14, marginBottom: 16 },
  potentialTile: { borderWidth: 1, borderRadius: 12, padding: 10, alignItems: "center", minWidth: 96 },
  potentialLevel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 },
  potentialValue: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  potentialSub: { fontSize: 9, color: colors.gray500 },
  levelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray100 },
  levelRowLabel: { fontSize: 12, fontWeight: "700", color: colors.gray900, width: 64 },
  levelRowSub: { fontSize: 11, color: colors.gray500 },
  levelRowCoins: { fontSize: 12, fontWeight: "700", color: "#b45309" },
  levelRowCash: { fontSize: 10, color: colors.gray400, marginTop: 1 },
  networkLevelBox: { borderWidth: 1, borderRadius: 10, marginBottom: 8, overflow: "hidden" },
  networkLevelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  networkLevelTitle: { fontSize: 12, fontWeight: "700" },
  networkLevelToggle: { fontSize: 16, fontWeight: "700" },
  networkMembers: { backgroundColor: "rgba(255,255,255,0.7)", paddingHorizontal: 12, paddingVertical: 8 },
  networkMemberRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  networkMemberName: { fontSize: 11, color: colors.gray700 },
  networkMemberDate: { fontSize: 11, color: colors.gray400 },
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
  ledgerFrom: { fontSize: 13, fontWeight: "400", color: colors.gray500 },
  ledgerPoints: { fontSize: 13, fontWeight: "700", color: "#b45309" },
  pagerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 12, marginBottom: 8 },
  pagerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.gray200, borderRadius: 8 },
  pagerBtnDisabled: { opacity: 0.4 },
  pagerBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  pagerLabel: { fontSize: 12, color: colors.gray500 },
});
