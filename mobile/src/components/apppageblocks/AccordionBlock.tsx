import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function AccordionBlock({ block }: { block: any }) {
  const { items, allowMultiple, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  const [open, setOpen] = useState<Set<number>>(new Set(list.length ? [0] : []));

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = allowMultiple ? new Set(prev) : new Set<number>();
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <View style={[{ borderWidth: 1, borderColor: colors.gray200 }, applyBlockStyle(style)]}>
      {list.map((item: any, i: number) => (
        <View key={i} style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.gray200 }}>
          <Pressable onPress={() => toggle(i)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray900, flex: 1 }}>{item.title}</Text>
            <Ionicons name={open.has(i) ? "chevron-up" : "chevron-down"} size={16} color={colors.gray400} />
          </Pressable>
          {open.has(i) && (
            <Text style={{ fontSize: 13, color: colors.gray600, paddingHorizontal: 14, paddingBottom: 14, lineHeight: 19 }}>{item.content}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
