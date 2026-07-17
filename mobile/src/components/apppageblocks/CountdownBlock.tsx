import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownBlock({ block }: { block: any }) {
  const { targetDate, expiredText, style } = block.props || {};
  const [timeLeft, setTimeLeft] = useState(() => (targetDate ? getTimeLeft(targetDate) : null));

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!timeLeft) {
    return <Text style={[{ fontSize: 16, fontWeight: "700", color: colors.gray900, textAlign: "center" }, applyBlockStyle(style)]}>{expiredText || "Event has ended!"}</Text>;
  }

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <View style={[{ flexDirection: "row", justifyContent: "center", gap: 16 }, applyBlockStyle(style)]}>
      {units.map((u) => (
        <View key={u.label} style={{ alignItems: "center", minWidth: 48 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.gray900 }}>{String(u.value).padStart(2, "0")}</Text>
          <Text style={{ fontSize: 10, color: colors.gray400, textTransform: "uppercase", marginTop: 2 }}>{u.label}</Text>
        </View>
      ))}
    </View>
  );
}
