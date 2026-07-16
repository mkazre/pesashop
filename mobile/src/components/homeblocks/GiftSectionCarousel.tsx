import { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { useBlockProducts } from "./useBlockProducts";
import { useCurrencyStore } from "@/store";
import { resolveImageUrl, colors } from "@/theme";

interface Props {
  block: any;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

function aspectToRatio(aspect: string): number {
  switch (aspect) {
    case "4:3": return 4 / 3;
    case "3:4": return 3 / 4;
    case "4:5": return 4 / 5;
    case "1:1":
    default:    return 1;
  }
}

function ProductTile({
  product,
  cardStyle,
  titleClamp,
  imageAspect,
}: {
  product: any;
  cardStyle: string;
  titleClamp: number;
  imageAspect: string;
}) {
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const router = useRouter();
  const onSale = product.salePrice && product.salePrice < product.regularPrice;
  const cover = resolveImageUrl(product.featuredImage || product.images?.[0]);
  const showTitle = cardStyle === "detailed";
  const clamp = Math.max(1, Math.min(3, titleClamp || 2));
  const titleLineHeight = 14; // matches s.tileTitle fontSize 11 * 1.27
  return (
    <Pressable
      onPress={() => router.push(`/product/${product.slug || product._id}` as any)}
      style={s.tile}
    >
      {/* Image — fixed aspect */}
      <View style={[s.tileImageWrap, { aspectRatio: aspectToRatio(imageAspect) }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={s.tileImage} contentFit="contain" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.gray100 }} />
        )}
      </View>

      {/* Title — reserves N lines of space */}
      {showTitle ? (
        <Text
          style={[s.tileTitle, { minHeight: titleLineHeight * clamp }]}
          numberOfLines={clamp}
        >
          {product.name}
        </Text>
      ) : null}

      {/* Price row — pinned to bottom */}
      <View style={[s.tilePriceRow, { marginTop: "auto" }]}>
        {onSale ? <Text style={s.nowLabel}>Now </Text> : null}
        <Text style={s.tilePrice}>
          {formatPrice(product.salePrice || product.regularPrice || product.price || 0)}
        </Text>
        {onSale ? (
          <Text style={s.tilePriceWas}>{formatPrice(product.regularPrice || 0)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function SectionCard({ section, block, width }: { section: any; block: any; width: number }) {
  const router = useRouter();
  const { data: products, isLoading } = useBlockProducts(section.source || "newest", {
    categoryId: section.categoryId,
    productIds: section.productIds || null,
    limit: section.productLimit || block.giftProductsPerSection || 4,
  });

  const cols = block.giftProductColumns || 2;
  const gap = 6;
  const cardStyle = block.giftCardStyle || "compact";
  const titleClamp = block.giftCardTitleClamp || 2;
  const imageAspect = block.giftCardImageAspect || "1:1";

  return (
    <View
      style={{
        width,
        backgroundColor: block.giftSectionBgColor || "#ffffff",
        borderColor: block.giftSectionBorderColor || "#e5e7eb",
        borderWidth: parseInt(block.giftSectionBorderWidth || "1"),
        borderRadius: parseInt(block.giftSectionBorderRadius || "8"),
        overflow: "hidden",
      }}
    >
      <View style={[s.headerRow, { backgroundColor: section.headerBgColor || "#f3f4f6" }]}>
        <Text
          style={{
            fontSize: parseInt(block.giftSectionTitleSize || "14"),
            fontWeight: (block.giftSectionTitleWeight || "700") as any,
            color: block.giftSectionTitleColor || "#111827",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {section.title}
        </Text>
        {section.viewAllLink ? (
          <Pressable onPress={() => router.push(section.viewAllLink as any)}>
            <Text style={[s.viewAll, { color: block.giftSectionViewAllColor || colors.primary }]}>
              {section.viewAllText || "View all"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ padding: parseInt(block.giftSectionPadding || "12") }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
        ) : products.length === 0 ? (
          <Text style={{ fontSize: 11, color: colors.gray400, textAlign: "center", paddingVertical: 12 }}>
            No products
          </Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -gap / 2 }}>
            {products.slice(0, section.productLimit || 4).map((p: any) => (
              <View
                key={p._id}
                style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2, marginBottom: gap }}
              >
                <ProductTile
                  product={p}
                  cardStyle={cardStyle}
                  titleClamp={titleClamp}
                  imageAspect={imageAspect}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function GiftSectionCarousel({ block }: Props) {
  const sections = block.giftSections || [];

  // Visible per slide on mobile (default 1, optional 2)
  const visiblePerSlide = Math.max(1, Math.min(block.giftSectionsVisibleMobile || 1, sections.length || 1));
  const horizontalPadding = block.containerWidth === "full" ? 0 : 16;
  const innerWidth = SCREEN_WIDTH - horizontalPadding * 2;
  const sectionGap = parseInt(block.giftSectionGap || "16");
  const sectionWidth = visiblePerSlide === 1
    ? innerWidth
    : (innerWidth - sectionGap * (visiblePerSlide - 1)) / visiblePerSlide;

  const scrollRef = useRef<ScrollView>(null);
  const [activePage, setActivePage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(sections.length / visiblePerSlide));
  // Distance between consecutive section start-offsets in the flat scroll
  // content must include the inter-card gap — omitting it here previously
  // made snapToInterval fall short of each card's true start by `sectionGap`
  // per step, drifting further right (cutting off the card's own right edge,
  // including "View all") the deeper you scrolled into the carousel.
  const pageWidth = (sectionWidth + sectionGap) * visiblePerSlide;

  // Autoplay
  useEffect(() => {
    if (!block.giftAutoplay || totalPages <= 1) return;
    const id = setInterval(() => {
      setActivePage((p) => {
        const next = (p + 1) % totalPages;
        scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
        return next;
      });
    }, Math.max(1500, block.giftAutoplayInterval || 5000));
    return () => clearInterval(id);
  }, [block.giftAutoplay, block.giftAutoplayInterval, totalPages, pageWidth]);

  if (sections.length === 0) {
    return (
      <BlockWrapper block={block}>
        <Text style={{ textAlign: "center", color: colors.gray400, fontSize: 12, paddingVertical: 16 }}>
          No sections yet
        </Text>
      </BlockWrapper>
    );
  }

  return (
    <BlockWrapper block={block}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        snapToAlignment="start"
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          setActivePage(Math.round(x / pageWidth));
        }}
        contentContainerStyle={{ gap: sectionGap }}
      >
        {sections.map((section: any, i: number) => (
          <SectionCard key={i} section={section} block={block} width={sectionWidth} />
        ))}
      </ScrollView>

      {block.giftShowDots !== false && totalPages > 1 ? (
        <View style={s.dotsRow}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === activePage ? { width: 18, backgroundColor: colors.gray900 } : { backgroundColor: colors.gray300 },
              ]}
            />
          ))}
        </View>
      ) : null}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  viewAll: {
    fontSize: 11,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  tile: {
    alignItems: "stretch",
    width: "100%",
    flex: 1,
  },
  tileImageWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tilePriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
    gap: 3,
  },
  nowLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
  },
  tilePrice: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray900,
  },
  tilePriceWas: {
    fontSize: 9,
    color: colors.gray400,
    textDecorationLine: "line-through",
  },
  tileTitle: {
    fontSize: 11,
    color: colors.gray700,
    marginTop: 2,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
