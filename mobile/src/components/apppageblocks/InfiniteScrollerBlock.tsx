import { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function InfiniteScrollerBlock({ block }: { block: any }) {
  const { items, speed, style } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  const text = list.map((it: any) => it.text).join("   •   ");
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!contentWidth) return;
    translateX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(translateX, { toValue: -contentWidth, duration: speed || 8000, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [contentWidth, speed]);

  if (!list.length) return null;

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
        <Text
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          style={[{ fontSize: 15, color: "#374151" }, applyBlockStyle(style)]}
          numberOfLines={1}
        >
          {text}   •   {text}
        </Text>
      </Animated.View>
    </View>
  );
}
