import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { LayoutDashboard, Type, Settings, Database } from 'lucide-react';
import { ContainerSettingsForNode } from './ContainerSettings';
import { HeadingSettingsForNode } from './HeadingSettings';
import { TextSettingsForNode } from './TextSettings';
import { ImageSettingsForNode } from './ImageSettings';
import { ButtonSettingsForNode } from './ButtonSettings';
import { GenericNodeSettings } from './GenericNodeSettings';
import { ComprehensiveSettings } from './ComprehensiveSettings';
import { HotspotSettings } from '../elements/enhanced/Hotspot';
import { BeforeAfterSettings } from '../elements/enhanced/BeforeAfter';
import { AnimatedHeadingSettings } from '../elements/enhanced/AnimatedHeading';
import { DualButtonSettings } from '../elements/enhanced/DualButton';
import { DualColorTextSettings } from '../elements/enhanced/DualColorText';
import { ContentSliderSettings } from '../elements/enhanced/ContentSlider';
import { CSSGridSettings } from '../elements/enhanced/CSSGrid';
import { AlertBoxSettings } from '../elements/enhanced/AlertBox';
import { BackToTopSettings } from '../elements/enhanced/BackToTop';
import { BurgerTriggerSettings } from '../elements/enhanced/BurgerTrigger';
import { CarouselBuilderSettings } from '../elements/enhanced/CarouselBuilder';
import { CartCounterSettings } from '../elements/enhanced/CartCounter';
import { CircularProgressSettings } from '../elements/enhanced/CircularProgress';
import { DivBlockSettings } from '../elements/enhanced/DivBlockSettings';
import { NewColumnsSettings } from '../elements/enhanced/NewColumnsSettings';
import { AccordionSettings } from '../elements/enhanced/AccordionSettings';
import { SliderSettings } from '../elements/enhanced/SliderSettings';
import { TestElementSettings } from '../elements/TestElement';
import { VideoSettings } from '../elements/Video';
import { GallerySettings } from '../elements/Gallery';
import { IconBoxSettings } from '../elements/IconBox';
import { TabsSettings } from '../elements/Tabs';
import { ModalSettings } from '../elements/Modal';
import { LinkButtonSettings } from '../elements/LinkButton';
import { LinkTextSettings } from '../elements/LinkText';
import { LinkWrapperSettings } from '../elements/LinkWrapper';
import { RichTextSettings } from '../elements/RichText';
import { CodeBlockSettings } from '../elements/CodeBlock';
import { ProgressBarSettings } from '../elements/ProgressBar';
import { TestimonialSettings } from '../elements/Testimonial';
import { PricingBoxSettings } from '../elements/PricingBox';
import { SocialIconsSettings } from '../elements/SocialIcons';
import { MapEmbedSettings } from '../elements/MapEmbed';
import { SearchFormSettings } from '../elements/SearchForm';
import { LoginFormSettings } from '../elements/LoginForm';
import { ToggleSettings } from '../elements/Toggle';
import { SuperboxSettings } from '../elements/Superbox';
import { ShapeDividerSettings } from '../elements/ShapeDivider';
import { MenuSettings } from '../elements/Menu';
import { FancyIconSettings } from '../elements/FancyIcon';
// Batch 2: OxyUltimate
import { CountdownSettings } from '../elements/enhanced/Countdown';
import { FancyHeadingSettings } from '../elements/enhanced/FancyHeading';
import { HighlightedHeadingSettings } from '../elements/enhanced/HighlightedHeading';
import { IconListSettings } from '../elements/enhanced/IconList';
import { TooltipSettings } from '../elements/enhanced/Tooltip';
import { RatingSettings } from '../elements/enhanced/Rating';
import { OffCanvasSettings } from '../elements/enhanced/OffCanvas';
import { LightboxSettings } from '../elements/enhanced/Lightbox';
import { HoverAnimatedButtonSettings } from '../elements/enhanced/HoverAnimatedButton';
import { ImageMaskSettings } from '../elements/enhanced/ImageMask';
import { ImagePanelsSettings } from '../elements/enhanced/ImagePanels';
import { ShowMoreLessSettings } from '../elements/enhanced/ShowMoreLess';
import { SlidingMenuSettings } from '../elements/enhanced/SlidingMenu';
import { GallerySliderSettings } from '../elements/enhanced/GallerySlider';
// Batch 3: OxyExtras
import { CounterSettings } from '../elements/extras/Counter';
import { ContentSwitcherSettings } from '../elements/extras/ContentSwitcher';
import { ContentTimelineSettings } from '../elements/extras/ContentTimeline';
import { CopyToClipboardSettings } from '../elements/extras/CopyToClipboard';
import { ReadingProgressBarSettings } from '../elements/extras/ReadingProgressBar';
import { SocialShareButtonsSettings } from '../elements/extras/SocialShareButtons';
import { TableOfContentsSettings } from '../elements/extras/TableOfContents';
import { PreloaderSettings } from '../elements/extras/Preloader';
import { ToggleSwitchSettings } from '../elements/extras/ToggleSwitch';
import { CopyrightYearSettings } from '../elements/extras/CopyrightYear';
import { HeaderSearchSettings } from '../elements/extras/HeaderSearch';
import { MediaPlayerSettings } from '../elements/extras/MediaPlayer';
// Batch 4: WooCommerce
import { ProductImagesSettings } from '../elements/woo/ProductImages';
import { ProductTitleSettings } from '../elements/woo/ProductTitle';
import { ProductPriceSettings } from '../elements/woo/ProductPrice';
import { ProductDescriptionSettings } from '../elements/woo/ProductDescription';
import { ProductCartButtonSettings } from '../elements/woo/ProductCartButton';
import { ProductRatingSettings } from '../elements/woo/ProductRating';
import { ProductMetaSettings } from '../elements/woo/ProductMeta';
import { ProductTabsSettings } from '../elements/woo/ProductTabs';
import { ProductStockSettings } from '../elements/woo/ProductStock';
import { MiniCartSettings } from '../elements/woo/MiniCart';
import { BreadcrumbSettings } from '../elements/woo/Breadcrumb';
// Batch 5: Remaining Oxygen Core
import { TextBlockSettings } from '../elements/TextBlock';
import { SpanSettings } from '../elements/Span';
import { ListItemSettings } from '../elements/ListItem';
import { EasyPostsSettings } from '../elements/EasyPosts';
import { DynamicListSettings } from '../elements/DynamicList';
import { SVGIconSettings } from '../elements/SVGIcon';
// Batch 6: Remaining OxyExtras
import { AdjacentPostsSettings } from '../elements/extras/AdjacentPosts';
import { AuthorBoxSettings } from '../elements/extras/AuthorBox';
import { DynamicTabsSettings } from '../elements/extras/DynamicTabs';
import { MegaMenuSettings } from '../elements/extras/MegaMenu';
import { ReadingTimeSettings } from '../elements/extras/ReadingTime';
import { PostTermsSettings } from '../elements/extras/PostTerms';
import { InfiniteScrollerSettings } from '../elements/extras/InfiniteScroller';
// Batch 7: Remaining WooCommerce
import { ProductExcerptSettings } from '../elements/woo/ProductExcerpt';
import { ProductRelatedSettings } from '../elements/woo/ProductRelated';
import { ProductUpsellsSettings } from '../elements/woo/ProductUpsells';
import { ProductCrosssellsSettings } from '../elements/woo/ProductCrosssells';
import { ArchiveProductsSettings } from '../elements/woo/ArchiveProducts';
import { ArchiveTitleSettings } from '../elements/woo/ArchiveTitle';
import { ArchiveDescriptionSettings } from '../elements/woo/ArchiveDescription';
import { ArchiveCategoriesSettings } from '../elements/woo/ArchiveCategories';
import { ShoppingCartPageSettings } from '../elements/woo/ShoppingCartPage';
import { CheckoutPageSettings } from '../elements/woo/CheckoutPage';
import { MyAccountSettings } from '../elements/woo/MyAccount';
import { CartTotalSettings } from '../elements/woo/CartTotal';
import { OrderTrackingSettings } from '../elements/woo/OrderTracking';
// Batch 8: Remaining OxyUltimate
import { UltimateImageSettings } from '../elements/enhanced/UltimateImage';
import { UltimateVideoSettings } from '../elements/enhanced/UltimateVideo';
import { RepeaterSettings } from '../panels/RepeaterSettings';
import { ProductGridSettings } from '../elements/ProductGrid';
import { HeaderSettings } from '../elements/Header';
import { HeaderRowSettings } from '../elements/HeaderRow';

const SETTINGS_FOR_NODE_MAP = {
  Container: ContainerSettingsForNode,
  Section: ContainerSettingsForNode,
  Heading: HeadingSettingsForNode,
  Text: TextSettingsForNode,
  Image: ImageSettingsForNode,
  Button: ButtonSettingsForNode,
  ProductCard: GenericNodeSettings,
  ProductGrid: ProductGridSettings,
  'Product Grid': ProductGridSettings,
  Repeater: RepeaterSettings,
  AddToCartButton: GenericNodeSettings,
  'Add to Cart Button': GenericNodeSettings,
  PriceDisplay: GenericNodeSettings,
  'Price Display': GenericNodeSettings,
  CategoryList: GenericNodeSettings,
  'Category List': GenericNodeSettings,
  Hotspot: HotspotSettings,
  'Before After': BeforeAfterSettings,
  AnimatedHeading: AnimatedHeadingSettings,
  'Animated Heading': AnimatedHeadingSettings,
  'Dual Button': DualButtonSettings,
  'Dual Color Text': DualColorTextSettings,
  'Content Slider': ContentSliderSettings,
  'CSS Grid': CSSGridSettings,
  'Alert Box': AlertBoxSettings,
  'Back to Top': BackToTopSettings,
  'Burger Trigger': BurgerTriggerSettings,
  'Carousel Builder': CarouselBuilderSettings,
  'Cart Counter': CartCounterSettings,
  'Circular Progress': CircularProgressSettings,
  'Div Block': DivBlockSettings,
  'Columns': NewColumnsSettings,
  'Accordion': AccordionSettings,
  'Slider': SliderSettings,
  'Test Element': TestElementSettings,
  // Batch 1: Core Oxygen Elements
  Video: VideoSettings,
  Gallery: GallerySettings,
  'Icon Box': IconBoxSettings,
  IconBox: IconBoxSettings,
  Tabs: TabsSettings,
  Modal: ModalSettings,
  'Link Button': LinkButtonSettings,
  LinkButton: LinkButtonSettings,
  'Link Text': LinkTextSettings,
  LinkText: LinkTextSettings,
  'Link Wrapper': LinkWrapperSettings,
  LinkWrapper: LinkWrapperSettings,
  'Rich Text': RichTextSettings,
  RichText: RichTextSettings,
  'Code Block': CodeBlockSettings,
  CodeBlock: CodeBlockSettings,
  'Progress Bar': ProgressBarSettings,
  ProgressBar: ProgressBarSettings,
  Testimonial: TestimonialSettings,
  'Pricing Box': PricingBoxSettings,
  PricingBox: PricingBoxSettings,
  'Social Icons': SocialIconsSettings,
  SocialIcons: SocialIconsSettings,
  Map: MapEmbedSettings,
  MapEmbed: MapEmbedSettings,
  'Search Form': SearchFormSettings,
  SearchForm: SearchFormSettings,
  'Login Form': LoginFormSettings,
  LoginForm: LoginFormSettings,
  Toggle: ToggleSettings,
  Superbox: SuperboxSettings,
  'Shape Divider': ShapeDividerSettings,
  ShapeDivider: ShapeDividerSettings,
  Menu: MenuSettings,
  'Fancy Icon': FancyIconSettings,
  FancyIcon: FancyIconSettings,
  // Batch 2: OxyUltimate
  Countdown: CountdownSettings,
  'Fancy Heading': FancyHeadingSettings,
  FancyHeading: FancyHeadingSettings,
  'Highlighted Heading': HighlightedHeadingSettings,
  HighlightedHeading: HighlightedHeadingSettings,
  'Icon List': IconListSettings,
  IconList: IconListSettings,
  Tooltip: TooltipSettings,
  Rating: RatingSettings,
  'Off Canvas': OffCanvasSettings,
  OffCanvas: OffCanvasSettings,
  Lightbox: LightboxSettings,
  'Hover Animated Button': HoverAnimatedButtonSettings,
  HoverAnimatedButton: HoverAnimatedButtonSettings,
  'Image Mask': ImageMaskSettings,
  ImageMask: ImageMaskSettings,
  'Image Panels': ImagePanelsSettings,
  ImagePanels: ImagePanelsSettings,
  'Show More/Less': ShowMoreLessSettings,
  ShowMoreLess: ShowMoreLessSettings,
  'Sliding Menu': SlidingMenuSettings,
  SlidingMenu: SlidingMenuSettings,
  'Gallery Slider': GallerySliderSettings,
  GallerySlider: GallerySliderSettings,
  // Batch 3: OxyExtras
  Counter: CounterSettings,
  'Content Switcher': ContentSwitcherSettings,
  ContentSwitcher: ContentSwitcherSettings,
  'Content Timeline': ContentTimelineSettings,
  ContentTimeline: ContentTimelineSettings,
  'Copy to Clipboard': CopyToClipboardSettings,
  CopyToClipboard: CopyToClipboardSettings,
  'Reading Progress Bar': ReadingProgressBarSettings,
  ReadingProgressBar: ReadingProgressBarSettings,
  'Social Share Buttons': SocialShareButtonsSettings,
  SocialShareButtons: SocialShareButtonsSettings,
  'Table of Contents': TableOfContentsSettings,
  TableOfContents: TableOfContentsSettings,
  Preloader: PreloaderSettings,
  'Toggle Switch': ToggleSwitchSettings,
  ToggleSwitch: ToggleSwitchSettings,
  'Copyright Year': CopyrightYearSettings,
  CopyrightYear: CopyrightYearSettings,
  'Header Search': HeaderSearchSettings,
  HeaderSearch: HeaderSearchSettings,
  'Media Player': MediaPlayerSettings,
  MediaPlayer: MediaPlayerSettings,
  // Batch 4: WooCommerce
  'Product Images': ProductImagesSettings,
  ProductImages: ProductImagesSettings,
  'Product Title': ProductTitleSettings,
  ProductTitle: ProductTitleSettings,
  'Product Price': ProductPriceSettings,
  ProductPrice: ProductPriceSettings,
  'Product Description': ProductDescriptionSettings,
  ProductDescription: ProductDescriptionSettings,
  'Product Cart Button': ProductCartButtonSettings,
  ProductCartButton: ProductCartButtonSettings,
  'Product Rating': ProductRatingSettings,
  ProductRating: ProductRatingSettings,
  'Product Meta': ProductMetaSettings,
  ProductMeta: ProductMetaSettings,
  'Product Tabs': ProductTabsSettings,
  ProductTabs: ProductTabsSettings,
  'Product Stock': ProductStockSettings,
  ProductStock: ProductStockSettings,
  'Mini Cart': MiniCartSettings,
  MiniCart: MiniCartSettings,
  Breadcrumb: BreadcrumbSettings,
  // Batch 5: Remaining Oxygen Core
  'Text Block': TextBlockSettings,
  TextBlock: TextBlockSettings,
  Span: SpanSettings,
  'List Item': ListItemSettings,
  List: ListItemSettings,
  ListItem: ListItemSettings,
  Header: HeaderSettings,
  'Header Row': HeaderRowSettings,
  HeaderRow: HeaderRowSettings,
  'Easy Posts': EasyPostsSettings,
  EasyPosts: EasyPostsSettings,
  'Dynamic List': DynamicListSettings,
  DynamicList: DynamicListSettings,
  'SVG Icon': SVGIconSettings,
  SVGIcon: SVGIconSettings,
  // Batch 6: Remaining OxyExtras
  'Adjacent Posts': AdjacentPostsSettings,
  AdjacentPosts: AdjacentPostsSettings,
  'Author Box': AuthorBoxSettings,
  AuthorBox: AuthorBoxSettings,
  'Dynamic Tabs': DynamicTabsSettings,
  DynamicTabs: DynamicTabsSettings,
  'Mega Menu': MegaMenuSettings,
  MegaMenu: MegaMenuSettings,
  'Reading Time': ReadingTimeSettings,
  ReadingTime: ReadingTimeSettings,
  'Post Terms': PostTermsSettings,
  PostTerms: PostTermsSettings,
  'Infinite Scroller': InfiniteScrollerSettings,
  InfiniteScroller: InfiniteScrollerSettings,
  // Batch 7: Remaining WooCommerce
  'Product Excerpt': ProductExcerptSettings,
  ProductExcerpt: ProductExcerptSettings,
  'Product Related': ProductRelatedSettings,
  ProductRelated: ProductRelatedSettings,
  'Product Upsells': ProductUpsellsSettings,
  ProductUpsells: ProductUpsellsSettings,
  'Product Cross-sells': ProductCrosssellsSettings,
  ProductCrosssells: ProductCrosssellsSettings,
  'Archive Products': ArchiveProductsSettings,
  ArchiveProducts: ArchiveProductsSettings,
  'Archive Title': ArchiveTitleSettings,
  ArchiveTitle: ArchiveTitleSettings,
  'Archive Description': ArchiveDescriptionSettings,
  ArchiveDescription: ArchiveDescriptionSettings,
  'Archive Categories': ArchiveCategoriesSettings,
  ArchiveCategories: ArchiveCategoriesSettings,
  'Shopping Cart Page': ShoppingCartPageSettings,
  ShoppingCartPage: ShoppingCartPageSettings,
  'Checkout Page': CheckoutPageSettings,
  CheckoutPage: CheckoutPageSettings,
  'My Account': MyAccountSettings,
  MyAccount: MyAccountSettings,
  'Cart Total': CartTotalSettings,
  CartTotal: CartTotalSettings,
  'Order Tracking': OrderTrackingSettings,
  OrderTracking: OrderTrackingSettings,
  // Batch 8: Remaining OxyUltimate
  'Ultimate Image': UltimateImageSettings,
  UltimateImage: UltimateImageSettings,
  'Ultimate Video': UltimateVideoSettings,
  UltimateVideo: UltimateVideoSettings,
};

const SETTINGS_TABS = [
  { id: 'layout', label: 'Layout', icon: LayoutDashboard },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'advanced', label: 'Advanced', icon: Settings },
  { id: 'dynamic', label: 'Dynamic', icon: Database },
];

export const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('layout');
  
  // Combine the useEditor calls to prevent issues with multiple calls
  const { selectedNodeId, selectedNode } = useEditor((state) => {
    const selected = state.events.selected;
    if (!selected || selected.size === 0) return { selectedNodeId: null, selectedNode: null };
    
    const id = Array.from(selected)[0];
    if (!id) return { selectedNodeId: null, selectedNode: null };
    
    const node = state.nodes[id];
    if (!node) return { selectedNodeId: id, selectedNode: null };
    
    const resolved = node.data.type?.resolvedName || node.data.displayName || node.data.name || 'Component';
    const displayName = node.data.displayName || node.data.name || resolved;
    
    return { 
      selectedNodeId: id, 
      selectedNode: { id, resolvedName: resolved, displayName } 
    };
  });

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-white border-l h-full flex items-center justify-center">
        <p>Select an element to edit its settings</p>
      </div>
    );
  }

  const SettingsComponent = SETTINGS_FOR_NODE_MAP[selectedNode.resolvedName] || SETTINGS_FOR_NODE_MAP[selectedNode.displayName];
  const useGeneric = !SettingsComponent || SettingsComponent === GenericNodeSettings;

  return (
    <div className="bg-white border-l h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-gray-50 shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">Settings</h3>
        <p className="text-xs text-gray-500 mt-0.5">{selectedNode.displayName}</p>
      </div>
      {/* Oxygen-style tabs: Layout, Typography, Advanced */}
      <div className="flex border-b border-gray-200 shrink-0">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'text-primary border-b-2 border-primary bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'layout' && !useGeneric && SettingsComponent ? (
          <SettingsComponent nodeId={selectedNodeId} />
        ) : (
          <ComprehensiveSettings nodeId={selectedNodeId} displayName={selectedNode.displayName} activeTab={activeTab} />
        )}
      </div>
    </div>
  );
};
