import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function FancyHeadingBlock({ block }: { block: any }) {
  const { text, style } = block.props || {};
  return (
    <Text style={[{ fontSize: 32, fontWeight: "800", color: "#0F604B", textAlign: "center" }, applyBlockStyle(style)]}>
      {text}
    </Text>
  );
}
