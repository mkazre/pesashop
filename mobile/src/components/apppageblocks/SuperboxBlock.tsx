import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function SuperboxBlock({ block }: { block: any }) {
  const { image, title, description, height, style } = block.props || {};
  const [revealed, setRevealed] = useState(false);
  const uri = resolveImageUrl(image);

  return (
    <Pressable
      onPress={() => setRevealed((v) => !v)}
      style={[{ height: height || 220, overflow: "hidden", backgroundColor: colors.gray100 }, applyBlockStyle(style)]}
    >
      {uri && <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />}
      {revealed && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 20 }}>
          {!!title && <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center" }}>{title}</Text>}
          {!!description && <Text style={{ color: "#fff", fontSize: 13, opacity: 0.9, textAlign: "center", marginTop: 6 }}>{description}</Text>}
        </View>
      )}
    </Pressable>
  );
}
