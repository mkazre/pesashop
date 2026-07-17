import { useRef, useState } from "react";
import { View, Text, PanResponder } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function BeforeAfterBlock({ block }: { block: any }) {
  const { beforeImage, afterImage, beforeLabel, afterLabel, height, style } = block.props || {};
  const [position, setPosition] = useState(50);
  const [width, setWidth] = useState(0);
  const beforeUri = resolveImageUrl(beforeImage);
  const afterUri = resolveImageUrl(afterImage);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (!width) return;
        const pct = Math.max(0, Math.min(100, (gesture.moveX / width) * 100));
        setPosition(pct);
      },
    })
  ).current;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[{ height: height || 260, overflow: "hidden", backgroundColor: colors.gray100 }, applyBlockStyle(style)]}
      {...panResponder.panHandlers}
    >
      {afterUri && <Image source={{ uri: afterUri }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />}
      {beforeUri && (
        <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${position}%`, overflow: "hidden" }}>
          <Image source={{ uri: beforeUri }} style={{ width, height: height || 260 }} contentFit="cover" />
        </View>
      )}
      <View style={{ position: "absolute", top: 0, bottom: 0, left: `${position}%`, width: 2, backgroundColor: "#fff", marginLeft: -1 }} />
      <View style={{ position: "absolute", bottom: 10, left: 10, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
        <Text style={{ color: "#fff", fontSize: 11 }}>{beforeLabel || "Before"}</Text>
      </View>
      <View style={{ position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
        <Text style={{ color: "#fff", fontSize: 11 }}>{afterLabel || "After"}</Text>
      </View>
    </View>
  );
}
