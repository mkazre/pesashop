import { View, Animated } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import { usePageScroll } from "./PageScrollContext";

export default function ReadingProgressBarBlock({ block }: { block: any }) {
  const { color, height, style } = block.props || {};
  const pageScroll = usePageScroll();

  if (!pageScroll) return null;

  const maxScroll = Math.max(1, pageScroll.contentHeight - pageScroll.layoutHeight);
  const widthPct = pageScroll.scrollY.interpolate({
    inputRange: [0, maxScroll],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={[{ height: height || 4, backgroundColor: colors.gray200, overflow: "hidden" }, applyBlockStyle(style)]}>
      <Animated.View style={{ width: widthPct, height: "100%", backgroundColor: color || colors.primary }} />
    </View>
  );
}
