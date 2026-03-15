import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function ScreenHeader({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[!transparent && s.headerBg, { paddingTop: insets.top }]}>
      <View style={s.row}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
        ) : (
          <View style={s.spacer} />
        )}
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {rightAction || <View style={s.spacer} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerBg: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 56, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: colors.gray50 },
  spacer: { width: 40 },
  title: { fontSize: 18, fontWeight: "700", color: colors.gray900, flex: 1, textAlign: "center" },
});
