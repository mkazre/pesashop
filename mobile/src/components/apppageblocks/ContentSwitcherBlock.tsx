import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ContentSwitcherBlock({ block }: { block: any }) {
  const { labelA, labelB, contentA, contentB, activeColor, style } = block.props || {};
  const [isB, setIsB] = useState(false);
  const accent = activeColor || colors.primary;

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: !isB ? "700" : "400", color: !isB ? accent : colors.gray500 }}>{labelA}</Text>
        <Pressable onPress={() => setIsB((v) => !v)} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: isB ? accent : colors.gray300 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", margin: 2, marginLeft: isB ? 22 : 2 }} />
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: isB ? "700" : "400", color: isB ? accent : colors.gray500 }}>{labelB}</Text>
      </View>
      <Text style={[{ fontSize: 14, color: colors.gray700, lineHeight: 20 }, applyBlockStyle(style)]}>{isB ? contentB : contentA}</Text>
    </View>
  );
}
