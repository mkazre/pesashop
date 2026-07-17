import { View } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function FancyIconBlock({ block }: { block: any }) {
  const { icon, style } = block.props || {};
  const computed = applyBlockStyle(style);

  return (
    <View
      style={[
        { alignSelf: "flex-start", alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight, borderRadius: 9999, padding: 16 },
        computed,
      ]}
    >
      <IconValue icon={icon} size={style?.fontSize || 28} color={computed.color || colors.primary} />
    </View>
  );
}
