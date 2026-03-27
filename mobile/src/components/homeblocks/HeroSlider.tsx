import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BlockWrapper from "./BlockWrapper";
import { resolveImageUrl, colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function overlayRgba(color: string, opacity: number) {
  const c = color || "#000000";
  const o = (opacity ?? 0) / 100;
  if (o <= 0) return "transparent";
  const r = parseInt(c.slice(1, 3), 16) || 0;
  const g = parseInt(c.slice(3, 5), 16) || 0;
  const b = parseInt(c.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${o})`;
}

export default function HeroSlider({ block }: { block: any }) {
  const slides = block.slides || [];
  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const timerRef = useRef<any>(null);

  const height = parseInt(block.sliderHeight) || 220;
  const borderRadius = parseInt(block.sliderBorderRadius) || 0;

  const next = useCallback(() => {
    setCurrent((c) => {
      const n = (c + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: n, animated: true });
      return n;
    });
  }, [slides.length]);

  useEffect(() => {
    if (!block.sliderAutoplay || slides.length <= 1) return;
    timerRef.current = setInterval(next, block.sliderSpeed || 5000);
    return () => clearInterval(timerRef.current);
  }, [block.sliderAutoplay, block.sliderSpeed, slides.length, next]);

  if (!slides.length) return null;

  const renderSlide = ({ item: slide }: { item: any }) => {
    const imgUrl = resolveImageUrl(slide.image);
    const overlayColor =
      slide.overlayOpacity != null
        ? overlayRgba(slide.overlayColor, slide.overlayOpacity)
        : slide.overlayColor || "transparent";

    const align =
      slide.textAlign === "center"
        ? "center"
        : slide.textAlign === "right"
        ? "flex-end"
        : "flex-start";

    return (
      <View style={{ width: SCREEN_WIDTH, height }}>
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f3f4f6" }]} />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
        <View
          style={[
            s.slideContent,
            { alignItems: align, justifyContent: "center" },
          ]}
        >
          {slide.heading ? (
            <Text
              style={[
                s.heading,
                { color: slide.textColor || "#ffffff", textAlign: slide.textAlign || "left" },
              ]}
            >
              {slide.heading.replace(/<br\s*\/?>/gi, "\n")}
            </Text>
          ) : null}
          {slide.subtitle ? (
            <Text
              style={[
                s.subtitle,
                { color: slide.textColor || "#ffffff", textAlign: slide.textAlign || "left" },
              ]}
            >
              {slide.subtitle}
            </Text>
          ) : null}
          {slide.buttonText && slide.buttonLink ? (
            <Pressable
              onPress={() => router.push(slide.buttonLink as any)}
              style={[
                s.button,
                {
                  backgroundColor:
                    block.buttonBgColor || block.primaryColor || colors.primary,
                },
              ]}
            >
              <Text style={s.buttonText}>{slide.buttonText}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <View style={{ borderRadius, overflow: "hidden" }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderSlide}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
            setCurrent(index);
          }}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
        />
        {block.showDots !== false && slides.length > 1 ? (
          <View style={s.dotsRow}>
            {slides.map((_: any, i: number) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i === current ? s.dotActive : s.dotInactive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  slideContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.9,
    maxWidth: "80%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#fff",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
