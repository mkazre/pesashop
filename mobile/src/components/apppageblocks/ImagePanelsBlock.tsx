import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ImagePanelsBlock({ block }: { block: any }) {
  const { panels, height, style } = block.props || {};
  const list = Array.isArray(panels) ? panels : [];
  const [active, setActive] = useState(0);

  return (
    <View style={[{ flexDirection: "row", height: height || 260, gap: 2, overflow: "hidden" }, applyBlockStyle(style)]}>
      {list.map((panel: any, i: number) => {
        const uri = resolveImageUrl(panel.src);
        return (
          <Pressable key={i} onPress={() => setActive(i)} style={{ flex: active === i ? 2.5 : 1, backgroundColor: colors.gray200 }}>
            {uri && <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.45)" }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }} numberOfLines={1}>{panel.title}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
