import HeadingBlock from "./HeadingBlock";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";
import ButtonBlock from "./ButtonBlock";
import ContainerBlock from "./ContainerBlock";
import ListBlock from "./ListBlock";
import VideoBlock from "./VideoBlock";
import GalleryBlock from "./GalleryBlock";
import LinkTextBlock from "./LinkTextBlock";
import LinkWrapperBlock from "./LinkWrapperBlock";
import FancyIconBlock from "./FancyIconBlock";
import RichTextBlock from "./RichTextBlock";
import CodeBlockBlock from "./CodeBlockBlock";
import SvgIconBlock from "./SvgIconBlock";
import IconBoxBlock from "./IconBoxBlock";
import ProgressBarBlock from "./ProgressBarBlock";
import TestimonialBlock from "./TestimonialBlock";
import PricingBoxBlock from "./PricingBoxBlock";
import SocialIconsBlock from "./SocialIconsBlock";
import MapBlock from "./MapBlock";
import SearchFormBlock from "./SearchFormBlock";
import LoginFormBlock from "./LoginFormBlock";
import CSSGridBlock from "./CSSGridBlock";
import ColumnsBlock from "./ColumnsBlock";
import HeaderRowBlock from "./HeaderRowBlock";
import AccordionBlock from "./AccordionBlock";
import SliderBlock from "./SliderBlock";
import TabsBlock from "./TabsBlock";
import ToggleBlock from "./ToggleBlock";
import SuperboxBlock from "./SuperboxBlock";
import ShapeDividerBlock from "./ShapeDividerBlock";
import MenuBlock from "./MenuBlock";
import EasyPostsBlock from "./EasyPostsBlock";
import DynamicListBlock from "./DynamicListBlock";
import ProductFeedBlock from "./ProductFeedBlock";
import FormEmbedBlock from "./FormEmbedBlock";
import AlertBoxBlock from "./AlertBoxBlock";
import AnimatedHeadingBlock from "./AnimatedHeadingBlock";
import BackToTopBlock from "./BackToTopBlock";
import BeforeAfterBlock from "./BeforeAfterBlock";
import CircularProgressBlock from "./CircularProgressBlock";
import CountdownBlock from "./CountdownBlock";
import DualButtonBlock from "./DualButtonBlock";
import DualColorTextBlock from "./DualColorTextBlock";
import FancyHeadingBlock from "./FancyHeadingBlock";
import HighlightedHeadingBlock from "./HighlightedHeadingBlock";
import HotspotBlock from "./HotspotBlock";
import HoverAnimatedButtonBlock from "./HoverAnimatedButtonBlock";
import IconListBlock from "./IconListBlock";
import ImageMaskBlock from "./ImageMaskBlock";
import ImagePanelsBlock from "./ImagePanelsBlock";
import LightboxBlock from "./LightboxBlock";
import RatingBlock from "./RatingBlock";
import ShowMoreLessBlock from "./ShowMoreLessBlock";
import TooltipBlock from "./TooltipBlock";
import UltimateImageBlock from "./UltimateImageBlock";
import UltimateVideoBlock from "./UltimateVideoBlock";
import AdjacentPostsBlock from "./AdjacentPostsBlock";
import AuthorBoxBlock from "./AuthorBoxBlock";
import ContentSwitcherBlock from "./ContentSwitcherBlock";
import ContentTimelineBlock from "./ContentTimelineBlock";
import CopyrightYearBlock from "./CopyrightYearBlock";
import CounterBlock from "./CounterBlock";
import InfiniteScrollerBlock from "./InfiniteScrollerBlock";
import MediaPlayerBlock from "./MediaPlayerBlock";
import PostTermsBlock from "./PostTermsBlock";
import PreloaderBlock from "./PreloaderBlock";
import ReadingProgressBarBlock from "./ReadingProgressBarBlock";
import ReadingTimeBlock from "./ReadingTimeBlock";
import SocialShareButtonsBlock from "./SocialShareButtonsBlock";
import TableOfContentsBlock from "./TableOfContentsBlock";
import ToggleSwitchBlock from "./ToggleSwitchBlock";

// blockType -> native RN renderer. Split into its own file (rather than
// living inline in AppPageRenderer.tsx) so ContainerBlock can also import it
// to render its own children without a circular import between the two.
export const BLOCK_COMPONENTS: Record<string, React.ComponentType<{ block: any }>> = {
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  container: ContainerBlock,
  list: ListBlock,
  video: VideoBlock,
  gallery: GalleryBlock,
  // Link Button is content-identical to Button (text/linkType/link/style) —
  // reuse the same renderer rather than duplicating it.
  "link-button": ButtonBlock,
  "link-text": LinkTextBlock,
  "link-wrapper": LinkWrapperBlock,
  "fancy-icon": FancyIconBlock,
  "rich-text": RichTextBlock,
  // Text Block ("HTML paragraph block") is content-identical to Rich Text —
  // both are an HTML string rendered through the same allow-listed parser.
  "text-block": RichTextBlock,
  // Span is a plain inline text run; reusing TextBlock is a reasonable
  // simplification since this app's block list has no true inline-flow
  // concept (each block is its own row).
  span: TextBlock,
  "code-block": CodeBlockBlock,
  "svg-icon": SvgIconBlock,
  "icon-box": IconBoxBlock,
  "progress-bar": ProgressBarBlock,
  testimonial: TestimonialBlock,
  "pricing-box": PricingBoxBlock,
  "social-icons": SocialIconsBlock,
  map: MapBlock,
  "search-form": SearchFormBlock,
  "login-form": LoginFormBlock,
  // Section, Div Block and Header are all plain full-width containers with
  // a direction/gap content schema identical to Container's — no need for
  // three near-duplicate renderers.
  section: ContainerBlock,
  "div-block": ContainerBlock,
  header: ContainerBlock,
  "css-grid": CSSGridBlock,
  columns: ColumnsBlock,
  "header-row": HeaderRowBlock,
  accordion: AccordionBlock,
  slider: SliderBlock,
  tabs: TabsBlock,
  toggle: ToggleBlock,
  superbox: SuperboxBlock,
  "shape-divider": ShapeDividerBlock,
  menu: MenuBlock,
  "easy-posts": EasyPostsBlock,
  "dynamic-list": DynamicListBlock,
  repeater: ProductFeedBlock,
  "form-embed": FormEmbedBlock,
  "alert-box": AlertBoxBlock,
  "animated-heading": AnimatedHeadingBlock,
  "back-to-top": BackToTopBlock,
  "before-after": BeforeAfterBlock,
  // Carousel Builder, Content Slider and Gallery Slider are all
  // content-identical to Slider (images + title/caption array) — reuse the
  // same renderer rather than three near-duplicates.
  "carousel-builder": SliderBlock,
  "content-slider": SliderBlock,
  "gallery-slider": SliderBlock,
  "circular-progress": CircularProgressBlock,
  countdown: CountdownBlock,
  "dual-button": DualButtonBlock,
  "dual-color-text": DualColorTextBlock,
  "fancy-heading": FancyHeadingBlock,
  "highlighted-heading": HighlightedHeadingBlock,
  hotspot: HotspotBlock,
  "hover-animated-button": HoverAnimatedButtonBlock,
  "icon-list": IconListBlock,
  "image-mask": ImageMaskBlock,
  "image-panels": ImagePanelsBlock,
  lightbox: LightboxBlock,
  rating: RatingBlock,
  "show-more-less": ShowMoreLessBlock,
  tooltip: TooltipBlock,
  "ultimate-image": UltimateImageBlock,
  "ultimate-video": UltimateVideoBlock,
  "adjacent-posts": AdjacentPostsBlock,
  "author-box": AuthorBoxBlock,
  "content-switcher": ContentSwitcherBlock,
  "content-timeline": ContentTimelineBlock,
  "copyright-year": CopyrightYearBlock,
  counter: CounterBlock,
  "infinite-scroller": InfiniteScrollerBlock,
  "media-player": MediaPlayerBlock,
  "post-terms": PostTermsBlock,
  preloader: PreloaderBlock,
  "reading-progress-bar": ReadingProgressBarBlock,
  "reading-time": ReadingTimeBlock,
  "social-share-buttons": SocialShareButtonsBlock,
  "table-of-contents": TableOfContentsBlock,
  "toggle-switch": ToggleSwitchBlock,
};
