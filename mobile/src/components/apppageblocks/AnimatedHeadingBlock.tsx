import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function AnimatedHeadingBlock({ block }: { block: any }) {
  const { text, animationType, style } = block.props || {};
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(animationType === "slideUp" ? 20 : 0)).current;
  const scale = useRef(new Animated.Value(animationType === "zoomIn" ? 0.8 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        { fontSize: 24, fontWeight: "700", color: "#111827" },
        applyBlockStyle(style),
        { opacity, transform: [{ translateY: translate }, { scale }] },
      ]}
    >
      {text}
    </Animated.Text>
  );
}
