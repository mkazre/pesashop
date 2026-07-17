import { View, Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function IconListBlock({ block }: { block: any }) {
  const { items, layout, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];

  return (
    <View style={{ flexDirection: layout === "horizontal" ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
      {list.map((item: any, i: number) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconValue icon={item.icon} size={16} color={item.color || "#22c55e"} />
          <Text style={[{ fontSize: 14, color: "#374151" }, applyBlockStyle(style)]}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}
