import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function HotspotBlock({ block }: { block: any }) {
  const { image, markers, style } = block.props || {};
  const list = Array.isArray(markers) ? markers : [];
  const uri = resolveImageUrl(image);
  const [active, setActive] = useState<number | null>(null);

  return (
    <View style={[{ minHeight: 180, backgroundColor: colors.gray100 }, applyBlockStyle(style)]}>
      {uri && <Image source={{ uri }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />}
      {list.map((m: any, i: number) => (
        <Pressable
          key={i}
          onPress={() => setActive(active === i ? null : i)}
          style={{ position: "absolute", left: `${m.x || 50}%`, top: `${m.y || 50}%`, marginLeft: -10, marginTop: -10 }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, borderWidth: 2, borderColor: "#fff" }} />
          {active === i && (
            <View style={{ position: "absolute", bottom: 24, backgroundColor: "#1f2937", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, minWidth: 100 }}>
              <Text style={{ color: "#fff", fontSize: 12 }}>{m.text}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
