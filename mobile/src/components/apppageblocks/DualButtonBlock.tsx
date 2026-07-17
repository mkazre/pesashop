import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function DualButtonBlock({ block }: { block: any }) {
  const router = useRouter();
  const { primaryText, primaryLink, secondaryText, secondaryLink, style } = block.props || {};
  const [active, setActive] = useState<"primary" | "secondary">("primary");
  const computed = applyBlockStyle(style);

  const go = (link: string, which: "primary" | "secondary") => {
    setActive(which);
    const dest = resolveMenuLink({ linkType: "manual", link });
    if (dest) router.push(dest as any);
  };

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Pressable
        onPress={() => go(primaryLink, "primary")}
        style={[{ paddingVertical: 12, paddingHorizontal: 22 }, active === "primary" ? computed : { backgroundColor: colors.gray100 }]}
      >
        <Text style={{ fontWeight: "700", color: active === "primary" ? (computed.color as string) || "#fff" : colors.gray600 }}>{primaryText || "Primary Action"}</Text>
      </Pressable>
      <Pressable
        onPress={() => go(secondaryLink, "secondary")}
        style={[{ paddingVertical: 12, paddingHorizontal: 22, borderWidth: 1, borderColor: colors.gray300 }, active === "secondary" ? { backgroundColor: colors.primary } : { backgroundColor: colors.gray100 }]}
      >
        <Text style={{ fontWeight: "700", color: active === "secondary" ? "#fff" : colors.gray600 }}>{secondaryText || "Secondary Action"}</Text>
      </Pressable>
    </View>
  );
}
