import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function TabsBlock({ block }: { block: any }) {
  const { tabs, activeColor, style } = block.props || {};
  const list = Array.isArray(tabs) ? tabs : [];
  const [active, setActive] = useState(0);
  const accent = activeColor || colors.primary;

  if (!list.length) return null;

  return (
    <View style={applyBlockStyle(style)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 2, borderBottomColor: colors.gray200 }}>
        {list.map((tab: any, i: number) => (
          <Pressable
            key={i}
            onPress={() => setActive(i)}
            style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: i === active ? accent : "transparent", marginBottom: -2 }}
          >
            <Text style={{ fontSize: 13, fontWeight: i === active ? "700" : "400", color: i === active ? accent : colors.gray500 }}>{tab.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={{ fontSize: 13, color: colors.gray700, paddingTop: 14, lineHeight: 19 }}>{list[active]?.content || ""}</Text>
    </View>
  );
}
