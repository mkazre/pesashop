import { Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function PostTermsBlock({ block }: { block: any }) {
  const { taxonomy, terms, style } = block.props || {};
  const list = Array.isArray(terms) ? terms : [];

  return (
    <Text style={[{ fontSize: 14 }, applyBlockStyle(style)]}>
      {!!taxonomy && <Text style={{ fontWeight: "600", color: colors.gray700 }}>{taxonomy}: </Text>}
      <Text style={{ color: colors.primary }}>{list.map((t: any) => t.text).join(", ")}</Text>
    </Text>
  );
}
