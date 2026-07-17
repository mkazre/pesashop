import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function LinkTextBlock({ block }: { block: any }) {
  const router = useRouter();
  const { text, linkType, link, style } = block.props || {};

  const handlePress = () => {
    const dest = resolveMenuLink({ linkType, link });
    if (dest) router.push(dest as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={[{ color: colors.primary, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" }, applyBlockStyle(style)]}>
        {text || ""}
      </Text>
    </Pressable>
  );
}
