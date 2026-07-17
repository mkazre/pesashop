import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ProgressBarBlock({ block }: { block: any }) {
  const { label, value, max, showPercentage, barColor, trackColor, style } = block.props || {};
  const pct = Math.max(0, Math.min(100, ((value ?? 0) / (max || 100)) * 100));

  return (
    <View style={applyBlockStyle(style)}>
      {(!!label || showPercentage) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray700 }}>{label || ""}</Text>
          {showPercentage !== false && <Text style={{ fontSize: 12, color: colors.gray500 }}>{Math.round(pct)}%</Text>}
        </View>
      )}
      <View style={{ height: 8, backgroundColor: trackColor || colors.gray200, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: barColor || colors.primary }} />
      </View>
    </View>
  );
}
