import React from 'react';
import { useHomePageConfig } from '../../hooks/useHomePageConfig';
import HeroSliderFull from './HeroSliderFull';
import HeroSliderWithSideBanner from './HeroSliderWithSideBanner';
import BannerGrid3Col from './BannerGrid3Col';
import BannerFullWidth from './BannerFullWidth';
import BannerGrid2Col from './BannerGrid2Col';
import ProductGridTabs from './ProductGridTabs';
import ProductCarouselTabs from './ProductCarouselTabs';
import DealsOfTheDay from './DealsOfTheDay';
import ProductColumnsGrid from './ProductColumnsGrid';
import CategoryCarousel from './CategoryCarousel';
import FeatureIconsRow from './FeatureIconsRow';
import SpacerBlock from './SpacerBlock';
import RichTextBlock from './RichTextBlock';
import CustomHtmlBlock from './CustomHtmlBlock';
import CustomTemplateBlock from './CustomTemplateBlock';

const BLOCK_COMPONENTS = {
  'hero-slider-full': HeroSliderFull,
  'hero-slider-with-side-banner': HeroSliderWithSideBanner,
  'banner-grid-3col': BannerGrid3Col,
  'banner-full-width': BannerFullWidth,
  'banner-grid-2col': BannerGrid2Col,
  'product-grid-tabs': ProductGridTabs,
  'product-carousel-tabs': ProductCarouselTabs,
  'deals-of-the-day': DealsOfTheDay,
  'product-columns-grid': ProductColumnsGrid,
  'category-carousel': CategoryCarousel,
  'feature-icons-row': FeatureIconsRow,
  'spacer': SpacerBlock,
  'rich-text': RichTextBlock,
  'custom-html': CustomHtmlBlock,
  'custom-template': CustomTemplateBlock,
};

export default function HomePageRenderer() {
  const { data, isLoading, isError } = useHomePageConfig();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0F604B', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  const blocks = data.blocks || [];

  if (!blocks.length) {
    return null;
  }

  return (
    <div>
      {blocks.map((block, i) => {
        const Component = BLOCK_COMPONENTS[block.blockType];
        if (!Component) return null;
        return <Component key={block._id || `block-${i}`} block={block} />;
      })}
    </div>
  );
}
