import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function ReadingTimeBlock({ block }: { block: any }) {
  const { text, icon, style } = block.props || {};

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 6 }, applyBlockStyle(style)]}>
      <IconValue icon={icon} size={14} color={colors.gray500} />
      <Text style={{ fontSize: 13, color: colors.gray500 }}>{text || "5 min read"}</Text>
    </View>
  );
}
