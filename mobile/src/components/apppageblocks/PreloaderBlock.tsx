import { View, Text, ActivityIndicator } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function PreloaderBlock({ block }: { block: any }) {
  const { text, showText, color, style } = block.props || {};

  return (
    <View style={[{ alignItems: "center", gap: 8, paddingVertical: 12 }, applyBlockStyle(style)]}>
      <ActivityIndicator size="large" color={color || colors.primary} />
      {showText !== false && !!text && <Text style={{ fontSize: 12, color: colors.gray500 }}>{text}</Text>}
    </View>
  );
}
