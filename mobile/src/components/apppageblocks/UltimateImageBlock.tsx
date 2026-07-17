import { useState } from "react";
import { View, Text, Pressable, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { resolveImageUrl, colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function UltimateImageBlock({ block }: { block: any }) {
  const router = useRouter();
  const { src, alt, caption, link, lightbox, style } = block.props || {};
  const uri = resolveImageUrl(src);
  const [open, setOpen] = useState(false);

  const handlePress = () => {
    if (lightbox) {
      setOpen(true);
      return;
    }
    const dest = link ? resolveMenuLink({ linkType: "manual", link }) : null;
    if (dest) router.push(dest as any);
  };

  const pressable = !!lightbox || !!link;

  return (
    <View>
      <Pressable onPress={pressable ? handlePress : undefined} disabled={!pressable}>
        {uri ? (
          <Image source={{ uri }} accessibilityLabel={alt} style={[{ width: "100%", aspectRatio: 16 / 9 }, applyBlockStyle(style)]} contentFit="cover" />
        ) : (
          <View style={[{ width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />
        )}
      </Pressable>
      {!!caption && <Text style={{ fontSize: 12, color: colors.gray500, textAlign: "center", marginTop: 6 }}>{caption}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
          {uri && <Image source={{ uri }} style={{ width: SCREEN_WIDTH * 0.92, height: SCREEN_HEIGHT * 0.75 }} contentFit="contain" />}
          <Pressable onPress={() => setOpen(false)} style={{ position: "absolute", top: 48, right: 20 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
