import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function AdjacentPostsBlock({ block }: { block: any }) {
  const router = useRouter();
  const { prevLabel, prevTitle, prevLink, nextLabel, nextTitle, nextLink, style } = block.props || {};

  const go = (link: string) => {
    const dest = resolveMenuLink({ linkType: "manual", link });
    if (dest) router.push(dest as any);
  };

  return (
    <View
      style={[
        { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.gray200 },
        applyBlockStyle(style),
      ]}
    >
      <Pressable onPress={() => prevLink && go(prevLink)} style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.gray400 }}>{prevLabel || "← Previous"}</Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{prevTitle}</Text>
      </Pressable>
      <Pressable onPress={() => nextLink && go(nextLink)} style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={{ fontSize: 11, color: colors.gray400 }}>{nextLabel || "Next →"}</Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, textAlign: "right" }}>{nextTitle}</Text>
      </Pressable>
    </View>
  );
}
