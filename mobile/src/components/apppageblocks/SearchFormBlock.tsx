import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function SearchFormBlock({ block }: { block: any }) {
  const router = useRouter();
  const { placeholder, style } = block.props || {};
  const computed = applyBlockStyle(style);

  return (
    <Pressable
      onPress={() => router.push("/search" as any)}
      style={[
        { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, paddingVertical: 12, paddingHorizontal: 14 },
        computed,
      ]}
    >
      <Ionicons name="search" size={16} color={colors.gray400} />
      <Text style={{ fontSize: 14, color: colors.gray400 }}>{placeholder || "Search…"}</Text>
    </Pressable>
  );
}
