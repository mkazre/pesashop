import { useRef } from "react";
import { Text, Pressable, Animated } from "react-native";
import { useRouter } from "expo-router";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function HoverAnimatedButtonBlock({ block }: { block: any }) {
  const router = useRouter();
  const { text, link, style } = block.props || {};
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    const dest = resolveMenuLink({ linkType: "manual", link });
    if (dest) router.push(dest as any);
  };

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: "flex-start" }}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[{ backgroundColor: "#0F604B", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8 }, applyBlockStyle(style)]}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14, textAlign: "center" }}>{text || "Tap Me"}</Text>
      </Pressable>
    </Animated.View>
  );
}
