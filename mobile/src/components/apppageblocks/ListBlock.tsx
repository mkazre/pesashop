import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ListBlock({ block }: { block: any }) {
  const { items, icon, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  const computed = applyBlockStyle(style);

  return (
    <View style={{ gap: 8 }}>
      {list.map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={(icon as any) || "checkmark-circle"} size={16} color={computed.color || colors.primary} />
          <Text style={[{ fontSize: 14, color: colors.gray700, flex: 1 }, computed]}>{item.text || ""}</Text>
        </View>
      ))}
    </View>
  );
}
