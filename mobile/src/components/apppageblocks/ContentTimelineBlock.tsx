import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ContentTimelineBlock({ block }: { block: any }) {
  const { items, dotColor, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  const dot = dotColor || colors.primary;

  return (
    <View style={[{ paddingLeft: 20 }, applyBlockStyle(style)]}>
      {list.map((item: any, i: number) => (
        <View key={i} style={{ marginBottom: i < list.length - 1 ? 20 : 0, position: "relative" }}>
          <View style={{ position: "absolute", left: -20, top: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: dot, borderWidth: 2, borderColor: "#fff" }} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: dot, textTransform: "uppercase" }}>{item.date}</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray900, marginTop: 2 }}>{item.title}</Text>
          <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>{item.description}</Text>
        </View>
      ))}
    </View>
  );
}
