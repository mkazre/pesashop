import { useState, useRef } from "react";
import { View, Text, Dimensions, NativeSyntheticEvent, NativeScrollEvent, ScrollView } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SliderBlock({ block }: { block: any }) {
  const { slides, showDots, height, style } = block.props || {};
  const list = Array.isArray(slides) ? slides : [];
  const [index, setIndex] = useState(0);
  const slideWidth = SCREEN_WIDTH - 32;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (i !== index) setIndex(i);
  };

  if (!list.length) return null;

  return (
    <View style={[{ height: height || 220, overflow: "hidden" }, applyBlockStyle(style)]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width: slideWidth }}
      >
        {list.map((slide: any, i: number) => {
          const uri = resolveImageUrl(slide.src);
          return (
            <View key={i} style={{ width: slideWidth, height: height || 220 }}>
              {uri ? (
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <View style={{ width: "100%", height: "100%", backgroundColor: colors.gray100 }} />
              )}
              {!!(slide.title || slide.caption) && (
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", padding: 12 }}>
                  {!!slide.title && <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{slide.title}</Text>}
                  {!!slide.caption && <Text style={{ color: "#fff", fontSize: 12, opacity: 0.9 }}>{slide.caption}</Text>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      {showDots !== false && list.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, position: "absolute", bottom: 8, left: 0, right: 0 }}>
          {list.map((_: any, i: number) => (
            <View key={i} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? colors.primary : "#fff" }} />
          ))}
        </View>
      )}
    </View>
  );
}
