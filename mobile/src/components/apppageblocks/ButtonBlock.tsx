import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ButtonBlock({ block }: { block: any }) {
  const router = useRouter();
  const { text, linkType, link, style } = block.props || {};

  const handlePress = () => {
    const dest = resolveMenuLink({ linkType, link });
    if (dest) router.push(dest as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center" },
        applyBlockStyle(style),
      ]}
    >
      <Text style={{ color: style?.color || "#ffffff", fontSize: style?.fontSize || 14, fontWeight: (style?.fontWeight as any) || "700" }}>
        {text || "Button"}
      </Text>
    </Pressable>
  );
}
