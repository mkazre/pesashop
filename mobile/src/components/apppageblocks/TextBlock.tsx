import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function TextBlock({ block }: { block: any }) {
  const { text, style } = block.props || {};
  return (
    <Text style={[{ fontSize: 14, color: "#374151", lineHeight: 20 }, applyBlockStyle(style)]}>
      {text || ""}
    </Text>
  );
}
