import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={36} color={colors.gray400} />
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={s.btn}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 64 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: colors.gray800, marginBottom: 8 },
  message: { fontSize: 14, color: colors.gray500, textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 0 },
  btnText: { color: colors.white, fontWeight: "600" },
});
