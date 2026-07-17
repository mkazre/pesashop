import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function MenuBlock({ block }: { block: any }) {
  const router = useRouter();
  const { items, layout, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  const computed = applyBlockStyle(style);

  const handlePress = (item: any) => {
    const dest = resolveMenuLink({ linkType: "manual", link: item.link });
    if (dest) router.push(dest as any);
  };

  return (
    <View style={{ flexDirection: layout === "vertical" ? "column" : "row", flexWrap: "wrap", gap: 18 }}>
      {list.map((item: any, i: number) => (
        <Pressable key={i} onPress={() => handlePress(item)}>
          <Text style={[{ fontSize: 14, fontWeight: "600", color: colors.gray700 }, computed]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
