import { useEffect, useState, useRef } from "react";
import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function CounterBlock({ block }: { block: any }) {
  const { startValue, endValue, duration, prefix, suffix, title, style } = block.props || {};
  const start = startValue ?? 0;
  const end = endValue ?? 1000;
  const [count, setCount] = useState(start);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const dur = duration || 2000;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / dur, 1);
      setCount(Math.floor(start + (end - start) * progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [start, end, duration]);

  return (
    <View style={[{ alignItems: "center" }, applyBlockStyle(style)]}>
      <Text style={{ fontSize: 32, fontWeight: "800", color: colors.gray900 }}>
        {prefix}{count.toLocaleString()}{suffix}
      </Text>
      {!!title && <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{title}</Text>}
    </View>
  );
}
