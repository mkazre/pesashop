import { useState } from "react";
import { View, Text, Pressable, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LightboxBlock({ block }: { block: any }) {
  const { images, columns, style } = block.props || {};
  const list = Array.isArray(images) ? images : [];
  const cols = columns || 3;
  const [active, setActive] = useState<number | null>(null);

  return (
    <View>
      <View style={[{ flexDirection: "row", flexWrap: "wrap" }, applyBlockStyle(style)]}>
        {list.map((img: any, i: number) => {
          const uri = resolveImageUrl(img.src);
          return (
            <Pressable key={i} onPress={() => setActive(i)} style={{ width: `${100 / cols}%`, aspectRatio: 1, padding: 2 }}>
              {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <View style={{ width: "100%", height: "100%", backgroundColor: colors.gray100 }} />}
            </Pressable>
          );
        })}
      </View>

      <Modal visible={active !== null} transparent animationType="fade" onRequestClose={() => setActive(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
          {active !== null && (
            <Image
              source={{ uri: resolveImageUrl(list[active]?.src) || undefined }}
              style={{ width: SCREEN_WIDTH * 0.9, height: SCREEN_HEIGHT * 0.7 }}
              contentFit="contain"
            />
          )}
          {active !== null && active > 0 && (
            <Pressable onPress={() => setActive(active - 1)} style={{ position: "absolute", left: 16, top: "50%" }}>
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </Pressable>
          )}
          {active !== null && active < list.length - 1 && (
            <Pressable onPress={() => setActive(active + 1)} style={{ position: "absolute", right: 16, top: "50%" }}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </Pressable>
          )}
          <Pressable onPress={() => setActive(null)} style={{ position: "absolute", top: 48, right: 20 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {active !== null && (
            <Text style={{ position: "absolute", bottom: 40, color: "#fff", fontSize: 13 }}>{active + 1} / {list.length}</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}
