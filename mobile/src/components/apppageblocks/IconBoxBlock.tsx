import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import IconValue from "./IconValue";

export default function IconBoxBlock({ block }: { block: any }) {
  const { icon, title, description, layout, style } = block.props || {};
  const computed = applyBlockStyle(style);
  const isLeft = layout === "left";

  return (
    <View style={{ flexDirection: isLeft ? "row" : "column", alignItems: isLeft ? "flex-start" : "center", gap: 10 }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
        <IconValue icon={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: isLeft ? 1 : undefined, alignItems: isLeft ? "flex-start" : "center" }}>
        {!!title && <Text style={[{ fontSize: 15, fontWeight: "700", color: colors.gray900, textAlign: isLeft ? "left" : "center" }, computed]}>{title}</Text>}
        {!!description && <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 4, textAlign: isLeft ? "left" : "center" }}>{description}</Text>}
      </View>
    </View>
  );
}
