import { View, Text, Pressable, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store";
import { authAPI } from "@/services/api";
import { colors } from "@/theme";
import { CURRENT_ACCOUNT_TOUR_VERSION, ACCOUNT_TOUR_LOCAL_KEY } from "@/constants/onboarding";
import { scrollToTourZone } from "@/utils/accountTourTargets";

export default function TourTooltip({
  isFirstStep,
  isLastStep,
  currentStep,
  handleNext,
  handlePrev,
  handleStop,
}: any) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [title, ...bodyParts] = (currentStep?.text || "").split("\n");
  const body = bodyParts.join("\n");

  const finishTour = (markSeen: boolean) => {
    if (!markSeen) return;
    const onboarding = {
      ...(user?.onboarding || {}),
      accountTourVersion: CURRENT_ACCOUNT_TOUR_VERSION,
      accountTourDismissedAt: new Date().toISOString(),
    };
    updateUser({ onboarding });
    AsyncStorage.setItem(ACCOUNT_TOUR_LOCAL_KEY, String(CURRENT_ACCOUNT_TOUR_VERSION)).catch(() => {});
    authAPI.updateOnboarding({ accountTourVersion: CURRENT_ACCOUNT_TOUR_VERSION }).catch(() => {});
  };

  const onNext = async () => {
    if (isLastStep) {
      finishTour(true);
      handleStop?.();
      return;
    }
    await scrollToTourZone((currentStep?.order || 1) + 1);
    handleNext?.();
  };

  const onBack = async () => {
    await scrollToTourZone((currentStep?.order || 1) - 1);
    handlePrev?.();
  };

  const onDontShowAgain = () => {
    finishTour(true);
    handleStop?.();
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 220 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => handleStop?.()} accessibilityLabel={t("onboarding.tour.nav.close")}>
          <Ionicons name="close" size={18} color="#9ca3af" />
        </Pressable>
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.footer}>
        <Pressable onPress={onDontShowAgain}>
          <Text style={styles.dontShowAgain}>{t("onboarding.tour.nav.dontShowAgain")}</Text>
        </Pressable>
        <View style={styles.actions}>
          {!isFirstStep && (
            <Pressable onPress={onBack} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>{t("onboarding.tour.nav.back")}</Text>
            </Pressable>
          )}
          <Pressable onPress={onNext} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {isLastStep ? t("onboarding.tour.nav.finish") : t("onboarding.tour.nav.next")}
            </Text>
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
  },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  body: { fontSize: 13, color: "#4b5563", marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  dontShowAgain: { fontSize: 11, color: "#9ca3af", textDecorationLine: "underline" },
  actions: { flexDirection: "row", gap: 8 },
  secondaryBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  secondaryBtnText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  primaryBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
