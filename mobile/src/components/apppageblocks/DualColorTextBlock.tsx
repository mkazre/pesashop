import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function DualColorTextBlock({ block }: { block: any }) {
  const { text, splitPosition, firstColor, secondColor, style } = block.props || {};
  const t = text || "";
  const idx = Math.floor(((splitPosition ?? 50) / 100) * t.length);
  const computed = applyBlockStyle(style);

  return (
    <Text style={[{ fontSize: 24, fontWeight: "700" }, computed]}>
      <Text style={{ color: firstColor || "#0F604B" }}>{t.slice(0, idx)}</Text>
      <Text style={{ color: secondColor || "#111827" }}>{t.slice(idx)}</Text>
    </Text>
  );
}
