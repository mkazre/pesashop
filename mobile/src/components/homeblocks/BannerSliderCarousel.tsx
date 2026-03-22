import { View, Text, Pressable, FlatList, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { resolveImageUrl, colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BannerSliderCarousel({ block }: { block: any }) {
  const banners = block.banners || [];
  const router = useRouter();

  if (!banners.length) return null;

  const cardWidth = SCREEN_WIDTH * 0.65;
  const cardHeight = parseInt(block.bannerHeight) || 180;
  const borderRadius = parseInt(block.bannerBorderRadius) || 12;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={banners}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item: banner }) => {
          const imgUrl = resolveImageUrl(banner.image);
          return (
            <Pressable
              onPress={() => banner.buttonLink && router.push(banner.buttonLink as any)}
              style={[s.card, { width: cardWidth, height: cardHeight, borderRadius }]}
            >
              {imgUrl ? (
                <Image
                  source={{ uri: imgUrl }}
                  style={[StyleSheet.absoluteFill, { borderRadius }]}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f3f4f6", borderRadius }]} />
              )}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.1)", borderRadius }]} />
              <View style={s.content}>
                {banner.label ? (
                  <Text style={[s.label, { color: banner.textColor || "#333" }]}>
                    {banner.label}
                  </Text>
                ) : null}
                {banner.heading ? (
                  <Text style={[s.heading, { color: banner.textColor || "#333" }]} numberOfLines={2}>
                    {banner.heading}
                  </Text>
                ) : null}
                {banner.buttonText ? (
                  <Text
                    style={[
                      s.link,
                      { color: block.linkColor || block.primaryColor || colors.primary },
                    ]}
                  >
                    {banner.buttonText} →
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  card: {
    overflow: "hidden",
    position: "relative",
  },
  content: {
    position: "relative",
    zIndex: 10,
    padding: 14,
    flex: 1,
    justifyContent: "center",
  },
  label: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  heading: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 6 },
  link: { fontSize: 12, fontWeight: "600" },
});
