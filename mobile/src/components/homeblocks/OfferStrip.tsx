import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OfferStrip({ block }: { block: any }) {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!block.enableMarquee) return;
    const speed = block.marqueeSpeed || 30;
    const duration = (SCREEN_WIDTH * 4 * 1000) / speed;
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH * 2,
        duration,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [block.enableMarquee, block.marqueeSpeed]);

  const content = (
    <View style={s.row}>
      {block.stripText ? (
        <Text
          style={[
            s.text,
            {
              color: block.stripTextColor || "#fff",
              fontSize: parseInt(block.stripFontSize) || 16,
            },
          ]}
        >
          {block.stripText}
        </Text>
      ) : null}
      {block.highlightText ? (
        <Text
          style={[
            s.text,
            {
              color: block.stripHighlightColor || "#f7bd20",
              fontSize: parseInt(block.stripFontSize) || 16,
            },
          ]}
        >
          {block.highlightText}
        </Text>
      ) : null}
    </View>
  );

  const inner = (
    <View
      style={[
        s.strip,
        {
          backgroundColor: block.stripBgColor || "#0F604B",
          paddingVertical: parseInt(block.paddingTop) || 12,
        },
      ]}
    >
      {block.enableMarquee ? (
        <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
          {content}
          <View style={{ width: 40 }} />
          {content}
          <View style={{ width: 40 }} />
          {content}
          <View style={{ width: 40 }} />
          {content}
        </Animated.View>
      ) : (
        content
      )}
    </View>
  );

  if (block.stripLink) {
    return (
      <Pressable onPress={() => router.push(block.stripLink as any)}>
        {inner}
      </Pressable>
    );
  }

  return inner;
}

const s = StyleSheet.create({
  strip: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: "700",
    textAlign: "center",
  },
});
