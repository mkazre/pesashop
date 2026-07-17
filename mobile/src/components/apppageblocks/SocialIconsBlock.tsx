import { View, Pressable, Linking } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function SocialIconsBlock({ block }: { block: any }) {
  const { icons, style } = block.props || {};
  const list = Array.isArray(icons) ? icons : [];
  const computed = applyBlockStyle(style);

  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      {list.map((item: any, i: number) => (
        <Pressable key={i} onPress={() => item.url && Linking.openURL(item.url)}>
          <IconValue icon={item.icon} size={22} color={computed.color || colors.gray700} />
        </Pressable>
      ))}
    </View>
  );
}
