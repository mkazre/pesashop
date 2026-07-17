import { ScrollView, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function CodeBlockBlock({ block }: { block: any }) {
  const { code, style } = block.props || {};

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ backgroundColor: "#1f2937", borderRadius: 0 }, applyBlockStyle(style)]}
      contentContainerStyle={{ padding: 12 }}
    >
      <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#e5e7eb" }}>{code || ""}</Text>
    </ScrollView>
  );
}
