import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgressBlock({ block }: { block: any }) {
  const { value, size, strokeWidth, progressColor, trackColor, showPercentage, text, style } = block.props || {};
  const s = size || 120;
  const sw = strokeWidth || 10;
  const radius = (s - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ?? 0, duration: 1200, useNativeDriver: false }).start();
  }, [value]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });

  return (
    <View style={[{ width: s, height: s, alignItems: "center", justifyContent: "center" }, applyBlockStyle(style)]}>
      <Svg width={s} height={s} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={s / 2} cy={s / 2} r={radius} stroke={trackColor || colors.gray200} strokeWidth={sw} fill="none" />
        <AnimatedCircle
          cx={s / 2}
          cy={s / 2}
          r={radius}
          stroke={progressColor || colors.primary}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {showPercentage !== false && <Text style={{ fontSize: 20, fontWeight: "800", color: colors.gray900 }}>{Math.round(value ?? 0)}%</Text>}
      {!!text && <Text style={{ fontSize: 11, color: colors.gray500 }}>{text}</Text>}
    </View>
  );
}
