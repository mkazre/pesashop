import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function TooltipBlock({ block }: { block: any }) {
  const { triggerText, tooltipText, style } = block.props || {};
  const [show, setShow] = useState(false);

  return (
    <View style={{ alignSelf: "flex-start" }}>
      <Pressable onPress={() => setShow((v) => !v)}>
        <Text style={[{ fontSize: 14, color: colors.gray700, textDecorationLine: "underline", textDecorationStyle: "dashed" }, applyBlockStyle(style)]}>
          {triggerText || "Tap for info"}
        </Text>
      </Pressable>
      {show && (
        <View style={{ marginTop: 6, backgroundColor: "#1f2937", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, maxWidth: 220 }}>
          <Text style={{ color: "#fff", fontSize: 12 }}>{tooltipText}</Text>
        </View>
      )}
    </View>
  );
}
