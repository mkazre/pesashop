import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors } from "@/theme";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <View style={[s.container, fullScreen ? s.fullScreen : s.padded]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={s.message}>{message}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  fullScreen: { flex: 1, backgroundColor: colors.white },
  padded: { paddingVertical: 48 },
  message: { fontSize: 14, color: colors.gray500, marginTop: 12 },
});
