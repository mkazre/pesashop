import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function HighlightedHeadingBlock({ block }: { block: any }) {
  const { beforeText, highlightText, afterText, highlightColor, highlightStyle, style } = block.props || {};
  const color = highlightColor || "#fbbf24";
  const hlStyle =
    highlightStyle === "underline"
      ? { textDecorationLine: "underline" as const, textDecorationColor: color }
      : highlightStyle === "color"
      ? { color }
      : { backgroundColor: color };

  return (
    <Text style={[{ fontSize: 26, fontWeight: "700", color: "#111827", textAlign: "center" }, applyBlockStyle(style)]}>
      {beforeText}
      <Text style={hlStyle}>{highlightText}</Text>
      {afterText}
    </Text>
  );
}
