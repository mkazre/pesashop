import { useState } from "react";
import { View, Text, Switch } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ToggleSwitchBlock({ block }: { block: any }) {
  const { label, defaultChecked, activeColor, style } = block.props || {};
  const [checked, setChecked] = useState(!!defaultChecked);

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, applyBlockStyle(style)]}>
      {!!label && <Text style={{ fontSize: 14, color: colors.gray700 }}>{label}</Text>}
      <Switch value={checked} onValueChange={setChecked} trackColor={{ true: activeColor || colors.primary, false: colors.gray300 }} />
    </View>
  );
}
