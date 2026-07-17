import { View, Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af", icon: "ℹ️" },
  success: { bg: "#d1fae5", border: "#10b981", text: "#065f46", icon: "✅" },
  warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", icon: "⚠️" },
  error: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b", icon: "❌" },
};

export default function AlertBoxBlock({ block }: { block: any }) {
  const { type, title, message, style } = block.props || {};
  const c = ALERT_COLORS[type as string] || ALERT_COLORS.info;

  return (
    <View style={[{ flexDirection: "row", gap: 10, padding: 14, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 8 }, applyBlockStyle(style)]}>
      <Text style={{ fontSize: 16 }}>{c.icon}</Text>
      <View style={{ flex: 1 }}>
        {!!title && <Text style={{ fontWeight: "700", color: c.text }}>{title}</Text>}
        {!!message && <Text style={{ fontSize: 13, color: c.text, marginTop: 2 }}>{message}</Text>}
      </View>
    </View>
  );
}
