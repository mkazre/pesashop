import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { referralsAPI } from "@/services/api";
import { colors } from "@/theme";

export default function ReferLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [referrer, setReferrer] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    referralsAPI.lookup(code)
      .then((res) => setReferrer(res.data?.data || res.data))
      .catch(() => setError("This referral link is invalid or expired."))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top, paddingHorizontal: 32 }]}>
        <Text style={s.errorTitle}>Oops</Text>
        <Text style={s.errorText}>{error}</Text>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Go to PesaShop</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.screen, s.center, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
      <View style={s.card}>
        <View style={s.iconCircle}><Text style={{ fontSize: 32 }}>🎁</Text></View>
        <Text style={s.title}>You've been invited!</Text>
        {referrer?.firstName && <Text style={s.subtitle}>{referrer.firstName} thinks you'll love PesaShop.</Text>}
        <Text style={s.desc}>
          Sign up with code <Text style={s.codeText}>{(code || "").toUpperCase()}</Text> and get welcome PESA Coins on your first purchase.
        </Text>
        <Pressable onPress={() => router.push({ pathname: "/auth/register", params: { ref: code } } as any)} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Create my account</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={{ marginTop: 12 }}>
          <Text style={s.browseText}>Just browse</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primaryLight },
  center: { alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 400, backgroundColor: colors.white, borderRadius: 16, padding: 28, alignItems: "center" },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.gray900, marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.gray600, marginBottom: 4, textAlign: "center" },
  desc: { fontSize: 13, color: colors.gray500, textAlign: "center", marginBottom: 24, lineHeight: 19 },
  codeText: { color: colors.primary, fontWeight: "700" },
  primaryBtn: { width: "100%", backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  browseText: { color: colors.gray500, fontSize: 13, textDecorationLine: "underline" },
  errorTitle: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  errorText: { fontSize: 14, color: colors.gray500, marginBottom: 24, textAlign: "center" },
});
