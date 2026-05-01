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
import BannerSliderCarousel from './BannerSliderCarousel';
import CouponCarousel from './CouponCarousel';
import ProductWithDealSidebar from './ProductWithDealSidebar';
import OfferStrip from './OfferStrip';
import BlogCarousel from './BlogCarousel';
import NewsletterBlock from './NewsletterBlock';
import CategoryGrid from './CategoryGrid';
import ProductVerticalTabs from './ProductVerticalTabs';
import ImageTextCta from './ImageTextCta';
import GiftSectionCarousel from './GiftSectionCarousel';

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
  'banner-slider-carousel': BannerSliderCarousel,
  'coupon-carousel': CouponCarousel,
  'product-with-deal-sidebar': ProductWithDealSidebar,
  'offer-strip': OfferStrip,
  'blog-carousel': BlogCarousel,
  'newsletter': NewsletterBlock,
  'category-grid': CategoryGrid,
  'product-vertical-tabs': ProductVerticalTabs,
  'image-text-cta': ImageTextCta,
  'gift-section-carousel': GiftSectionCarousel,
};

/**
 * Build a CSS class string that hides the block on specific device breakpoints.
 * desktop: ≥1024px, tablet: 768–1023px, mobile: <768px
 */
function getVisibilityClasses(block) {
  const vis = block.visibility;
  if (!vis) return '';
  const classes = [];
  // Hide on mobile (<768px)
  if (vis.mobile === false) classes.push('max-[767px]:hidden');
  // Hide on tablet (768–1023px)
  if (vis.tablet === false) classes.push('min-[768px]:max-[1023px]:hidden');
  // Hide on desktop (≥1024px)
  if (vis.desktop === false) classes.push('min-[1024px]:hidden');
  return classes.join(' ');
}

/**
 * Build responsive grid column overrides from block.responsive settings.
 * Returns a Tailwind class string if overrides are set.
 */
function getResponsiveColumnStyle(block) {
  const resp = block.responsive;
  if (!resp) return null;
  const styles = {};
  if (resp.mobileColumns > 0) styles['--resp-cols-mobile'] = resp.mobileColumns;
  if (resp.tabletColumns > 0) styles['--resp-cols-tablet'] = resp.tabletColumns;
  if (resp.desktopColumns > 0) styles['--resp-cols-desktop'] = resp.desktopColumns;
  return Object.keys(styles).length ? styles : null;
}

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

  // Filter: only show enabled blocks where platform.web is not explicitly false
  const visibleBlocks = blocks.filter((block) => {
    if (!block.enabled) return false;
    if (block.platform && block.platform.web === false) return false;
    return true;
  });

  if (!visibleBlocks.length) return null;

  return (
    <div>
      {visibleBlocks.map((block, i) => {
        const Component = BLOCK_COMPONENTS[block.blockType];
        if (!Component) return null;
        const visClasses = getVisibilityClasses(block);
        const respStyle = getResponsiveColumnStyle(block);
        return (
          <div key={block._id || `block-${i}`} className={visClasses || undefined} style={respStyle || undefined}>
            <Component block={block} />
          </div>
        );
      })}
    </div>
  );
}
