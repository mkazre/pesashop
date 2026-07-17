import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ToggleBlock({ block }: { block: any }) {
  const { title, content, defaultOpen, style } = block.props || {};
  const [open, setOpen] = useState(!!defaultOpen);

  return (
    <View style={[{ borderWidth: 1, borderColor: colors.gray200 }, applyBlockStyle(style)]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray900, flex: 1 }}>{title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.gray400} />
      </Pressable>
      {open && <Text style={{ fontSize: 13, color: colors.gray600, paddingHorizontal: 14, paddingBottom: 14, lineHeight: 19 }}>{content}</Text>}
    </View>
  );
}
