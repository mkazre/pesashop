import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function RatingBlock({ block }: { block: any }) {
  const { value, max, label, activeColor, style } = block.props || {};
  const v = value ?? 4;
  const m = max || 5;

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, applyBlockStyle(style)]}>
      {!!label && <Text style={{ fontSize: 13, color: colors.gray700 }}>{label}</Text>}
      <View style={{ flexDirection: "row", gap: 2 }}>
        {Array.from({ length: m }).map((_, i) => (
          <Ionicons key={i} name={i < v ? "star" : "star-outline"} size={16} color={activeColor || "#fbbf24"} />
        ))}
      </View>
    </View>
  );
}
