import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

const DEFAULT_SIZE: Record<string, number> = { h1: 32, h2: 26, h3: 22, h4: 18, h5: 16, h6: 14 };

export default function HeadingBlock({ block }: { block: any }) {
  const { text, level, style } = block.props || {};
  const computed = applyBlockStyle(style);
  return (
    <Text
      style={[
        { fontSize: DEFAULT_SIZE[level] || 24, fontWeight: "700", color: "#111827" },
        computed,
      ]}
    >
      {text || ""}
    </Text>
  );
}
