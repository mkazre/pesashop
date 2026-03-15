import { View, Text, Pressable, Dimensions, StyleSheet } from "react-native";
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

function BannerCard({
  banner,
  height,
  block,
}: {
  banner: any;
  height: number;
  block: any;
}) {
  const router = useRouter();
  const imgUrl = resolveImageUrl(banner.image);
  const overlay =
    banner.overlayOpacity != null
      ? overlayRgba(banner.overlayColor, banner.overlayOpacity)
      : banner.overlayColor || "transparent";

  return (
    <Pressable
      onPress={() => banner.buttonLink && router.push(banner.buttonLink as any)}
      style={[s.bannerCard, { minHeight: height }]}
    >
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]} />
      <View style={s.bannerContent}>
        {banner.label ? (
          <Text
            style={[
              s.bannerLabel,
              { color: banner.textColor || "#333" },
            ]}
          >
            {banner.label}
          </Text>
        ) : null}
        {banner.subtitle ? (
          <Text
            style={[s.bannerSubtitle, { color: banner.textColor || "#333" }]}
          >
            {banner.subtitle}
          </Text>
        ) : null}
        {banner.heading ? (
          <Text
            style={[s.bannerHeading, { color: banner.textColor || "#333" }]}
          >
            {banner.heading.replace(/<br\s*\/?>/gi, "\n")}
          </Text>
        ) : null}
        {banner.buttonText && banner.buttonLink ? (
          <Pressable
            onPress={() => router.push(banner.buttonLink as any)}
            style={[
              s.bannerBtn,
              {
                backgroundColor:
                  block.buttonBgColor || block.primaryColor || colors.primary,
              },
            ]}
          >
            <Text style={s.bannerBtnText}>{banner.buttonText}</Text>
            <Ionicons name="chevron-forward" size={12} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export function BannerFullWidth({ block }: { block: any }) {
  const banner = block.banners?.[0];
  if (!banner) return null;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <BannerCard banner={banner} height={180} block={block} />
    </BlockWrapper>
  );
}

export function BannerGrid2Col({ block }: { block: any }) {
  const banners = block.banners || [];
  if (!banners.length) return null;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <View style={s.grid2}>
        {banners.slice(0, 2).map((banner: any, i: number) => (
          <View key={i} style={{ flex: 1 }}>
            <BannerCard banner={banner} height={160} block={block} />
          </View>
        ))}
      </View>
    </BlockWrapper>
  );
}

export function BannerGrid3Col({ block }: { block: any }) {
  const banners = block.banners || [];
  if (!banners.length) return null;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <View style={s.grid3}>
        {banners.slice(0, 3).map((banner: any, i: number) => (
          <View key={i} style={{ width: (SCREEN_WIDTH - 48) / 2, minHeight: 150 }}>
            <BannerCard banner={banner} height={150} block={block} />
          </View>
        ))}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  bannerCard: {
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  bannerContent: {
    position: "relative",
    zIndex: 10,
    padding: 16,
    flex: 1,
    justifyContent: "center",
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  bannerHeading: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 10,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
  },
  bannerBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  grid2: {
    flexDirection: "row",
    gap: 8,
  },
  grid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
