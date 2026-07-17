import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function DynamicListBlock({ block }: { block: any }) {
  const { items, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];

  return (
    <View style={[{ gap: 10 }, applyBlockStyle(style)]}>
      {list.map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: colors.gray200, padding: 12 }}>
          {item.icon && <IconValue icon={item.icon} size={18} color={colors.primary} />}
          <View style={{ flex: 1 }}>
            {!!item.title && <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray900 }}>{item.title}</Text>}
            {!!item.description && <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{item.description}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
