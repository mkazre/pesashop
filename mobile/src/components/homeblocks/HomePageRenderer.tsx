import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { homePageConfigAPI } from "@/services/api";
import { colors } from "@/theme";

import HeroSlider from "./HeroSlider";
import ProductCarouselTabs from "./ProductCarouselTabs";
import ProductGridTabs from "./ProductGridTabs";
import CategoryCarousel from "./CategoryCarousel";
import DealsOfTheDay from "./DealsOfTheDay";
import { BannerFullWidth, BannerGrid2Col, BannerGrid3Col } from "./BannerBlocks";
import FeatureIconsRow from "./FeatureIconsRow";
import SpacerBlock from "./SpacerBlock";
import RichTextBlock from "./RichTextBlock";

const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: any }>> = {
  "hero-slider-full": HeroSlider,
  "hero-slider-with-side-banner": HeroSlider,
  "banner-grid-3col": BannerGrid3Col,
  "banner-full-width": BannerFullWidth,
  "banner-grid-2col": BannerGrid2Col,
  "product-grid-tabs": ProductGridTabs,
  "product-carousel-tabs": ProductCarouselTabs,
  "deals-of-the-day": DealsOfTheDay,
  "category-carousel": CategoryCarousel,
  "feature-icons-row": FeatureIconsRow,
  spacer: SpacerBlock,
  "rich-text": RichTextBlock,
};

interface HomePageRendererProps {
  onConfigLoaded?: (hasConfig: boolean) => void;
}

export default function HomePageRenderer({ onConfigLoaded }: HomePageRendererProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homePageConfigAPI
      .getPublic()
      .then((res) => {
        const config = res.data?.data || { blocks: [], isPublished: true };
        const b = config.blocks || [];
        setBlocks(b);
        onConfigLoaded?.(b.length > 0 && config.isPublished);
      })
      .catch(() => {
        setBlocks([]);
        onConfigLoaded?.(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!blocks.length) return null;

  return (
    <View>
      {blocks.map((block: any, i: number) => {
        const Component = BLOCK_COMPONENTS[block.blockType];
        if (!Component) return null;
        return <Component key={block._id || `block-${i}`} block={block} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  loading: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
});
