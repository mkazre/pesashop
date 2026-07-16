import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { authenticateBiometric } from "@/utils/biometricLock";
import { colors } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");

export default function BiometricLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [attempting, setAttempting] = useState(false);
  const [failed, setFailed] = useState(false);

  const attempt = async () => {
    setAttempting(true);
    setFailed(false);
    const ok = await authenticateBiometric("Unlock PesaShop");
    setAttempting(false);
    if (ok) onUnlock();
    else setFailed(true);
  };

  useEffect(() => {
    attempt();
  }, []);

  return (
    <View style={s.screen}>
      <Image source={LOGO} style={s.logo} contentFit="contain" />
      <View style={s.iconWrap}>
        <Ionicons name="finger-print" size={56} color={colors.white} />
      </View>
      <Text style={s.title}>PesaShop is locked</Text>
      <Text style={s.subtitle}>{failed ? "Authentication failed. Try again." : "Use Face ID or your fingerprint to continue"}</Text>
      <Pressable onPress={attempt} disabled={attempting} style={s.btn}>
        <Text style={s.btnText}>{attempting ? "Verifying..." : "Unlock"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logo: { width: 180, height: 56, marginBottom: 48 },
  iconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "700", color: colors.white, marginBottom: 8 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 32 },
  btn: { backgroundColor: colors.white, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 0 },
  btnText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});
