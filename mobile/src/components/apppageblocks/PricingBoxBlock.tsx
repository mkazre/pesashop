import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";

export default function PricingBoxBlock({ block }: { block: any }) {
  const router = useRouter();
  const { title, price, period, description, features, buttonText, linkType, buttonUrl, highlighted, style } = block.props || {};
  const list = Array.isArray(features) ? features : [];

  const handlePress = () => {
    const dest = resolveMenuLink({ linkType, link: buttonUrl });
    if (dest) router.push(dest as any);
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderWidth: highlighted ? 2 : 1,
          borderColor: highlighted ? colors.primary : colors.gray200,
          padding: 20,
        },
        applyBlockStyle(style),
      ]}
    >
      {!!title && <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray900 }}>{title}</Text>}
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 6 }}>
        {!!price && <Text style={{ fontSize: 28, fontWeight: "800", color: colors.gray900 }}>{price}</Text>}
        {!!period && <Text style={{ fontSize: 13, color: colors.gray400, marginBottom: 4 }}>{period}</Text>}
      </View>
      {!!description && <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 6 }}>{description}</Text>}
      {list.length > 0 && (
        <View style={{ marginTop: 14, gap: 8 }}>
          {list.map((f: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.gray700 }}>{f.text}</Text>
            </View>
          ))}
        </View>
      )}
      {!!buttonText && (
        <Pressable
          onPress={handlePress}
          style={{ marginTop: 18, backgroundColor: highlighted ? colors.primary : colors.gray100, paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: highlighted ? colors.white : colors.gray800, fontWeight: "700", fontSize: 14 }}>{buttonText}</Text>
        </Pressable>
      )}
    </View>
  );
}
