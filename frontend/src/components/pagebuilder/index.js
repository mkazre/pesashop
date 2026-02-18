// Layout
import { Container } from './Container';
import { Section } from './Section';
import { DivBlock } from './DivBlock';
import { NewColumns } from './NewColumns';
import { Column } from './Column';
import { CSSGrid } from './CSSGrid';
import { Accordion } from './Accordion';
import { Slider } from './Slider';

// Basic
import { Text } from './Text';
import { Heading } from './Heading';
import { Image } from './Image';
import { Button } from './Button';

// Core Oxygen
import { Video } from './Video';
import { Gallery } from './Gallery';
import { IconBox } from './IconBox';
import { Tabs } from './Tabs';
import { Modal } from './Modal';
import { LinkButton } from './LinkButton';
import { LinkText } from './LinkText';
import { LinkWrapper } from './LinkWrapper';
import { RichText } from './RichText';
import { CodeBlock } from './CodeBlock';
import { ProgressBar } from './ProgressBar';
import { Testimonial } from './Testimonial';
import { PricingBox } from './PricingBox';
import { SocialIcons } from './SocialIcons';
import { MapEmbed } from './MapEmbed';
import { SearchForm } from './SearchForm';
import { LoginForm } from './LoginForm';
import { Toggle } from './Toggle';
import { Superbox } from './Superbox';
import { ShapeDivider } from './ShapeDivider';
import { Menu } from './Menu';
import { FancyIcon } from './FancyIcon';

// Enhanced / OxyUltimate
import { AnimatedHeading } from './AnimatedHeading';
import { DualColorText } from './DualColorText';
import { DualButton } from './DualButton';
import { Hotspot } from './Hotspot';
import { BeforeAfter } from './BeforeAfter';
import { ContentSlider } from './ContentSlider';
import { AlertBox } from './AlertBox';
import { BackToTop } from './BackToTop';
import { BurgerTrigger } from './BurgerTrigger';
import { CarouselBuilder } from './CarouselBuilder';
import { CartCounter } from './CartCounter';
import { CircularProgress } from './CircularProgress';
import { Countdown } from './Countdown';
import { FancyHeading } from './FancyHeading';
import { HighlightedHeading } from './HighlightedHeading';
import { IconList } from './IconList';
import { Tooltip } from './Tooltip';
import { Rating } from './Rating';
import { OffCanvas } from './OffCanvas';
import { Lightbox } from './Lightbox';
import { HoverAnimatedButton } from './HoverAnimatedButton';
import { ImageMask } from './ImageMask';
import { ImagePanels } from './ImagePanels';
import { ShowMoreLess } from './ShowMoreLess';
import { SlidingMenu } from './SlidingMenu';
import { GallerySlider } from './GallerySlider';
import { TestElement } from './TestElement';

// OxyExtras
import { Counter } from './Counter';
import { ContentSwitcher } from './ContentSwitcher';
import { ContentTimeline } from './ContentTimeline';
import { CopyToClipboard } from './CopyToClipboard';
import { ReadingProgressBar } from './ReadingProgressBar';
import { SocialShareButtons } from './SocialShareButtons';
import { TableOfContents } from './TableOfContents';
import { Preloader } from './Preloader';
import { ToggleSwitch } from './ToggleSwitch';
import { CopyrightYear } from './CopyrightYear';
import { HeaderSearch } from './HeaderSearch';
import { MediaPlayer } from './MediaPlayer';

// Batch 5: Remaining Oxygen Core
import { TextBlock } from './TextBlock';
import { Span } from './Span';
import { ListItem } from './ListItem';
import { Header } from './Header';
import { HeaderRow } from './HeaderRow';
import { EasyPosts } from './EasyPosts';
import { DynamicList } from './DynamicList';
import { SVGIcon } from './SVGIcon';

// Batch 6: Remaining OxyExtras
import { AdjacentPosts } from './AdjacentPosts';
import { AuthorBox } from './AuthorBox';
import { DynamicTabs } from './DynamicTabs';
import { MegaMenu } from './MegaMenu';
import { ReadingTime } from './ReadingTime';
import { PostTerms } from './PostTerms';
import { InfiniteScroller } from './InfiniteScroller';

// Shop / WooCommerce
import { ProductCard } from './ProductCard';
import { ProductGrid } from './ProductGrid';
import { Repeater } from './Repeater';
import { AddToCartButton } from './AddToCartButton';
import { PriceDisplay } from './PriceDisplay';
import { CategoryList } from './CategoryList';
import { ProductImages } from './ProductImages';
import { ProductTitle } from './ProductTitle';
import { ProductPrice } from './ProductPrice';
import { ProductDescription } from './ProductDescription';
import { ProductCartButton } from './ProductCartButton';
import { ProductRating } from './ProductRating';
import { ProductMeta } from './ProductMeta';
import { ProductTabs } from './ProductTabs';
import { ProductStock } from './ProductStock';
import { MiniCart } from './MiniCart';
import { Breadcrumb } from './Breadcrumb';

// Batch 7: Remaining WooCommerce
import { ProductExcerpt } from './ProductExcerpt';
import { ProductRelated } from './ProductRelated';
import { ProductUpsells } from './ProductUpsells';
import { ProductCrosssells } from './ProductCrosssells';
import { ArchiveProducts } from './ArchiveProducts';
import { ArchiveTitle } from './ArchiveTitle';
import { ArchiveDescription } from './ArchiveDescription';
import { ArchiveCategories } from './ArchiveCategories';
import { ShoppingCartPage } from './ShoppingCartPage';
import { CheckoutPage } from './CheckoutPage';
import { MyAccount } from './MyAccount';
import { CartTotal } from './CartTotal';
import { OrderTracking } from './OrderTracking';

// Batch 8: Remaining OxyUltimate
import { UltimateImage } from './UltimateImage';
import { UltimateVideo } from './UltimateVideo';

// HOC that wraps every element with dynamic data resolution + style cleaning
import { withDynamicProps } from './withDynamicProps';

/**
 * Wrap every element in the resolver with withDynamicProps so that ALL elements
 * automatically resolve dynamic bindings ({{product.name}}, {{category.name}}, etc.)
 * and strip non-CSS keys (responsive, responsiveProps, badge) from inline styles.
 */
const w = withDynamicProps;

export const pageBuilderResolver = {
  // Layout — Column/NewColumns are NOT wrapped because NewColumns passes
  // the raw Column import to <Element is={Column}> and Craft.js matches by reference.
  Container: w(Container),
  Section: w(Section),
  DivBlock: w(DivBlock),
  NewColumns,
  Column,
  CSSGrid: w(CSSGrid),
  Accordion: w(Accordion),
  Slider: w(Slider),

  // Basic
  Text: w(Text),
  Heading: w(Heading),
  Image: w(Image),
  Button: w(Button),

  // Core Oxygen
  Video: w(Video),
  Gallery: w(Gallery),
  IconBox: w(IconBox),
  Tabs: w(Tabs),
  Modal: w(Modal),
  LinkButton: w(LinkButton),
  LinkText: w(LinkText),
  LinkWrapper: w(LinkWrapper),
  RichText: w(RichText),
  CodeBlock: w(CodeBlock),
  ProgressBar: w(ProgressBar),
  Testimonial: w(Testimonial),
  PricingBox: w(PricingBox),
  SocialIcons: w(SocialIcons),
  MapEmbed: w(MapEmbed),
  SearchForm: w(SearchForm),
  LoginForm: w(LoginForm),
  Toggle: w(Toggle),
  Superbox: w(Superbox),
  ShapeDivider: w(ShapeDivider),
  Menu: w(Menu),
  FancyIcon: w(FancyIcon),

  // Enhanced / OxyUltimate
  AnimatedHeading: w(AnimatedHeading),
  DualColorText: w(DualColorText),
  DualButton: w(DualButton),
  Hotspot: w(Hotspot),
  BeforeAfter: w(BeforeAfter),
  ContentSlider: w(ContentSlider),
  AlertBox: w(AlertBox),
  BackToTop: w(BackToTop),
  BurgerTrigger: w(BurgerTrigger),
  CarouselBuilder: w(CarouselBuilder),
  CartCounter: w(CartCounter),
  CircularProgress: w(CircularProgress),
  Countdown: w(Countdown),
  FancyHeading: w(FancyHeading),
  HighlightedHeading: w(HighlightedHeading),
  IconList: w(IconList),
  Tooltip: w(Tooltip),
  Rating: w(Rating),
  OffCanvas: w(OffCanvas),
  Lightbox: w(Lightbox),
  HoverAnimatedButton: w(HoverAnimatedButton),
  ImageMask: w(ImageMask),
  ImagePanels: w(ImagePanels),
  ShowMoreLess: w(ShowMoreLess),
  SlidingMenu: w(SlidingMenu),
  GallerySlider: w(GallerySlider),
  TestElement: w(TestElement),

  // OxyExtras
  Counter: w(Counter),
  ContentSwitcher: w(ContentSwitcher),
  ContentTimeline: w(ContentTimeline),
  CopyToClipboard: w(CopyToClipboard),
  ReadingProgressBar: w(ReadingProgressBar),
  SocialShareButtons: w(SocialShareButtons),
  TableOfContents: w(TableOfContents),
  Preloader: w(Preloader),
  ToggleSwitch: w(ToggleSwitch),
  CopyrightYear: w(CopyrightYear),
  HeaderSearch: w(HeaderSearch),
  MediaPlayer: w(MediaPlayer),

  // Batch 5: Remaining Oxygen Core
  TextBlock: w(TextBlock),
  Span: w(Span),
  ListItem: w(ListItem),
  Header: w(Header),
  HeaderRow: w(HeaderRow),
  EasyPosts: w(EasyPosts),
  DynamicList: w(DynamicList),
  SVGIcon: w(SVGIcon),

  // Batch 6: Remaining OxyExtras
  AdjacentPosts: w(AdjacentPosts),
  AuthorBox: w(AuthorBox),
  DynamicTabs: w(DynamicTabs),
  MegaMenu: w(MegaMenu),
  ReadingTime: w(ReadingTime),
  PostTerms: w(PostTerms),
  InfiniteScroller: w(InfiniteScroller),

  // Shop / WooCommerce
  ProductCard: w(ProductCard),
  ProductGrid: w(ProductGrid),
  Repeater: w(Repeater),
  AddToCartButton: w(AddToCartButton),
  PriceDisplay: w(PriceDisplay),
  CategoryList: w(CategoryList),
  ProductImages: w(ProductImages),
  ProductTitle: w(ProductTitle),
  ProductPrice: w(ProductPrice),
  ProductDescription: w(ProductDescription),
  ProductCartButton: w(ProductCartButton),
  ProductRating: w(ProductRating),
  ProductMeta: w(ProductMeta),
  ProductTabs: w(ProductTabs),
  ProductStock: w(ProductStock),
  MiniCart: w(MiniCart),
  Breadcrumb: w(Breadcrumb),

  // Batch 7: Remaining WooCommerce
  ProductExcerpt: w(ProductExcerpt),
  ProductRelated: w(ProductRelated),
  ProductUpsells: w(ProductUpsells),
  ProductCrosssells: w(ProductCrosssells),
  ArchiveProducts: w(ArchiveProducts),
  ArchiveTitle: w(ArchiveTitle),
  ArchiveDescription: w(ArchiveDescription),
  ArchiveCategories: w(ArchiveCategories),
  ShoppingCartPage: w(ShoppingCartPage),
  CheckoutPage: w(CheckoutPage),
  MyAccount: w(MyAccount),
  CartTotal: w(CartTotal),
  OrderTracking: w(OrderTracking),

  // Batch 8: Remaining OxyUltimate
  UltimateImage: w(UltimateImage),
  UltimateVideo: w(UltimateVideo),
};
