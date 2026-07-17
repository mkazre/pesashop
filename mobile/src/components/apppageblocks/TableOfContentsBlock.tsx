import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function TableOfContentsBlock({ block }: { block: any }) {
  const { title, items, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];

  return (
    <View style={[{ backgroundColor: colors.gray50, borderRadius: 8, padding: 16 }, applyBlockStyle(style)]}>
      {!!title && <Text style={{ fontWeight: "700", fontSize: 15, color: colors.gray900, marginBottom: 8 }}>{title}</Text>}
      {list.map((item: any, i: number) => (
        <Text key={i} style={{ fontSize: 13, color: colors.gray700, paddingVertical: 4, paddingLeft: ((item.level || 1) - 1) * 14 }}>
          {item.text}
        </Text>
      ))}
    </View>
  );
}
