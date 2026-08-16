import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t("common.loading");
  return (
    <View style={[s.container, fullScreen ? s.fullScreen : s.padded]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {displayMessage && <Text style={s.message}>{displayMessage}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  fullScreen: { flex: 1, backgroundColor: colors.white },
  padded: { paddingVertical: 48 },
  message: { fontSize: 14, color: colors.gray500, marginTop: 12 },
});
