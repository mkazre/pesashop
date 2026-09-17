import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MotiView } from "moti";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";
import { WELCOME_PROMPT_DISMISSED_KEY } from "@/constants/onboarding";

const SHOW_DELAY_MS = 2500;

export default function WelcomePrompt() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(WELCOME_PROMPT_DISMISSED_KEY);
        if (dismissed === "true" || cancelled) return;
      } catch {
        // AsyncStorage unavailable — fail open, still show the prompt
      }
      timer = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, SHOW_DELAY_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(WELCOME_PROMPT_DISMISSED_KEY, "true").catch(() => {});
  };

  const handleSignIn = () => {
    dismiss();
    router.push("/auth/login" as any);
  };

  if (isAuthenticated || !visible) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20 }}
      style={styles.container}
    >
      <Pressable onPress={dismiss} style={styles.closeBtn} accessibilityLabel={t("onboarding.welcome.dismiss")}>
        <Ionicons name="close" size={18} color="#9ca3af" />
      </Pressable>
      <Text style={styles.title}>{t("onboarding.welcome.title")}</Text>
      <Text style={styles.body}>{t("onboarding.welcome.body")}</Text>
      <View style={styles.actions}>
        <Pressable onPress={handleSignIn} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{t("onboarding.welcome.ctaSignIn")}</Text>
        </Pressable>
        <Pressable onPress={dismiss} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>{t("onboarding.welcome.ctaMaybeLater")}</Text>
        </Pressable>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 110,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 40,
  },
  closeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    paddingRight: 20,
  },
  body: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "500",
  },
});
