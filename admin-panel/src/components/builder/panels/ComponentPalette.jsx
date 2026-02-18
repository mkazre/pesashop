import React from 'react';
import { useEditor, ROOT_NODE } from '@craftjs/core';
import toast from 'react-hot-toast';
import { useUndoRedo } from '@/components/builder/utils/UndoRedo';
import {
  Square,
  Layout,
  Type,
  Heading,
  Image,
  MousePointer,
  Package,
  LayoutGrid,
  Repeat,
  ShoppingCart,
  DollarSign,
  List,
  MapPin,
  Play,
  Grid3X3,
  Box,
  PanelTop,
  Link,
  Link2,
  FileCode,
  FileText,
  Star,
  BarChart3,
  Quote,
  CreditCard,
  Share2,
  Map,
  Search,
  LogIn,
  ToggleLeft,
  Layers,
  Sparkles,
  Menu as MenuIcon,
  ChevronDown,
  Timer,
  Highlighter,
  ListChecks,
  Info,
  PanelRight,
  Maximize,
  Zap,
  Hexagon,
  GalleryHorizontal,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Hash,
  ArrowLeftRight,
  Clock,
  Clipboard,
  Activity,
  Share,
  BookOpen,
  Loader,
  ToggleRight,
  Copyright,
  SearchIcon,
  PlayCircle,
  ImageIcon,
  Tag,
  FileText as FileTextIcon,
  ShoppingBag,
  StarIcon,
  Tags,
  PanelTopClose,
  PackageCheck,
  ShoppingCartIcon,
  Navigation,
  Code,
  Minus,
  ListOrdered,
  PanelTopOpen,
  Rows3,
  Newspaper,
  ListTree,
  Smile,
  ArrowRightLeft,
  User,
  PanelLeftOpen,
  LayoutList,
  BookOpenCheck,
  TagsIcon,
  ScrollText,
  ArrowUpRight,
  Shuffle,
  Heading1,
  AlignLeft,
  FolderOpen,
  UserCircle,
  Calculator,
  ImagePlus,
  Film,
} from 'lucide-react';
import { Container } from '@/components/builder/elements/Container';
import { Section } from '@/components/builder/elements/Section';
import { Text } from '@/components/builder/elements/Text';
import { Heading as HeadingEl } from '@/components/builder/elements/Heading';
import { Image as ImageEl } from '@/components/builder/elements/Image';
import { Button } from '@/components/builder/elements/Button';
import { ProductCard } from '@/components/builder/elements/ProductCard';
import { ProductGrid } from '@/components/builder/elements/ProductGrid';
import { Repeater } from '@/components/builder/elements/Repeater';
import { AddToCartButton } from '@/components/builder/elements/AddToCartButton';
import { PriceDisplay } from '@/components/builder/elements/PriceDisplay';
import { CategoryList } from '@/components/builder/elements/CategoryList';
import { Hotspot } from '@/components/builder/elements/enhanced/Hotspot';
import { BeforeAfter } from '@/components/builder/elements/enhanced/BeforeAfter';
import { AnimatedHeading } from '@/components/builder/elements/enhanced/AnimatedHeading';
import { DualButton } from '@/components/builder/elements/enhanced/DualButton';
import { DualColorText } from '@/components/builder/elements/enhanced/DualColorText';
import { ContentSlider } from '@/components/builder/elements/enhanced/ContentSlider';
import { AlertBox } from '@/components/builder/elements/enhanced/AlertBox';
import { BackToTop } from '@/components/builder/elements/enhanced/BackToTop';
import { BurgerTrigger } from '@/components/builder/elements/enhanced/BurgerTrigger';
import { CarouselBuilder } from '@/components/builder/elements/enhanced/CarouselBuilder';
import { CartCounter } from '@/components/builder/elements/enhanced/CartCounter';
import { CircularProgress } from '@/components/builder/elements/enhanced/CircularProgress';
import { CSSGrid } from '@/components/builder/elements/enhanced/CSSGrid';
import { DivBlock } from '@/components/builder/elements/enhanced/DivBlock';
import { NewColumns } from '@/components/builder/elements/enhanced/NewColumns';
import { Accordion } from '@/components/builder/elements/enhanced/Accordion';
import { Slider } from '@/components/builder/elements/enhanced/Slider';
import { TestElement } from '@/components/builder/elements/TestElement';
import { Video } from '@/components/builder/elements/Video';
import { Gallery } from '@/components/builder/elements/Gallery';
import { IconBox } from '@/components/builder/elements/IconBox';
import { Tabs as TabsEl } from '@/components/builder/elements/Tabs';
import { Modal } from '@/components/builder/elements/Modal';
import { LinkButton } from '@/components/builder/elements/LinkButton';
import { LinkText } from '@/components/builder/elements/LinkText';
import { LinkWrapper } from '@/components/builder/elements/LinkWrapper';
import { RichText } from '@/components/builder/elements/RichText';
import { CodeBlock } from '@/components/builder/elements/CodeBlock';
import { ProgressBar } from '@/components/builder/elements/ProgressBar';
import { Testimonial } from '@/components/builder/elements/Testimonial';
import { PricingBox } from '@/components/builder/elements/PricingBox';
import { SocialIcons } from '@/components/builder/elements/SocialIcons';
import { MapEmbed } from '@/components/builder/elements/MapEmbed';
import { SearchForm } from '@/components/builder/elements/SearchForm';
import { LoginForm } from '@/components/builder/elements/LoginForm';
import { Toggle } from '@/components/builder/elements/Toggle';
import { Superbox } from '@/components/builder/elements/Superbox';
import { ShapeDivider } from '@/components/builder/elements/ShapeDivider';
import { Menu as MenuEl } from '@/components/builder/elements/Menu';
import { FancyIcon } from '@/components/builder/elements/FancyIcon';
// Batch 2: OxyUltimate
import { Countdown } from '@/components/builder/elements/enhanced/Countdown';
import { FancyHeading } from '@/components/builder/elements/enhanced/FancyHeading';
import { HighlightedHeading } from '@/components/builder/elements/enhanced/HighlightedHeading';
import { IconList } from '@/components/builder/elements/enhanced/IconList';
import { Tooltip } from '@/components/builder/elements/enhanced/Tooltip';
import { Rating } from '@/components/builder/elements/enhanced/Rating';
import { OffCanvas } from '@/components/builder/elements/enhanced/OffCanvas';
import { Lightbox } from '@/components/builder/elements/enhanced/Lightbox';
import { HoverAnimatedButton } from '@/components/builder/elements/enhanced/HoverAnimatedButton';
import { ImageMask } from '@/components/builder/elements/enhanced/ImageMask';
import { ImagePanels } from '@/components/builder/elements/enhanced/ImagePanels';
import { ShowMoreLess } from '@/components/builder/elements/enhanced/ShowMoreLess';
import { SlidingMenu } from '@/components/builder/elements/enhanced/SlidingMenu';
import { GallerySlider } from '@/components/builder/elements/enhanced/GallerySlider';
// Batch 3: OxyExtras
import { Counter } from '@/components/builder/elements/extras/Counter';
import { ContentSwitcher } from '@/components/builder/elements/extras/ContentSwitcher';
import { ContentTimeline } from '@/components/builder/elements/extras/ContentTimeline';
import { CopyToClipboard } from '@/components/builder/elements/extras/CopyToClipboard';
import { ReadingProgressBar } from '@/components/builder/elements/extras/ReadingProgressBar';
import { SocialShareButtons } from '@/components/builder/elements/extras/SocialShareButtons';
import { TableOfContents } from '@/components/builder/elements/extras/TableOfContents';
import { Preloader } from '@/components/builder/elements/extras/Preloader';
import { ToggleSwitch } from '@/components/builder/elements/extras/ToggleSwitch';
import { CopyrightYear } from '@/components/builder/elements/extras/CopyrightYear';
import { HeaderSearch } from '@/components/builder/elements/extras/HeaderSearch';
import { MediaPlayer } from '@/components/builder/elements/extras/MediaPlayer';
// Batch 4: WooCommerce
import { ProductImages } from '@/components/builder/elements/woo/ProductImages';
import { ProductTitle } from '@/components/builder/elements/woo/ProductTitle';
import { ProductPrice } from '@/components/builder/elements/woo/ProductPrice';
import { ProductDescription } from '@/components/builder/elements/woo/ProductDescription';
import { ProductCartButton } from '@/components/builder/elements/woo/ProductCartButton';
import { ProductRating } from '@/components/builder/elements/woo/ProductRating';
import { ProductMeta } from '@/components/builder/elements/woo/ProductMeta';
import { ProductTabs } from '@/components/builder/elements/woo/ProductTabs';
import { ProductStock } from '@/components/builder/elements/woo/ProductStock';
import { MiniCart } from '@/components/builder/elements/woo/MiniCart';
import { Breadcrumb } from '@/components/builder/elements/woo/Breadcrumb';
// Batch 5: Remaining Oxygen Core
import { TextBlock } from '@/components/builder/elements/TextBlock';
import { Span } from '@/components/builder/elements/Span';
import { ListItem } from '@/components/builder/elements/ListItem';
import { Header as HeaderEl } from '@/components/builder/elements/Header';
import { HeaderRow } from '@/components/builder/elements/HeaderRow';
import { EasyPosts } from '@/components/builder/elements/EasyPosts';
import { DynamicList } from '@/components/builder/elements/DynamicList';
import { SVGIcon } from '@/components/builder/elements/SVGIcon';
// Batch 6: Remaining OxyExtras
import { AdjacentPosts } from '@/components/builder/elements/extras/AdjacentPosts';
import { AuthorBox } from '@/components/builder/elements/extras/AuthorBox';
import { DynamicTabs } from '@/components/builder/elements/extras/DynamicTabs';
import { MegaMenu } from '@/components/builder/elements/extras/MegaMenu';
import { ReadingTime } from '@/components/builder/elements/extras/ReadingTime';
import { PostTerms } from '@/components/builder/elements/extras/PostTerms';
import { InfiniteScroller } from '@/components/builder/elements/extras/InfiniteScroller';
// Batch 7: Remaining WooCommerce
import { ProductExcerpt } from '@/components/builder/elements/woo/ProductExcerpt';
import { ProductRelated } from '@/components/builder/elements/woo/ProductRelated';
import { ProductUpsells } from '@/components/builder/elements/woo/ProductUpsells';
import { ProductCrosssells } from '@/components/builder/elements/woo/ProductCrosssells';
import { ArchiveProducts } from '@/components/builder/elements/woo/ArchiveProducts';
import { ArchiveTitle } from '@/components/builder/elements/woo/ArchiveTitle';
import { ArchiveDescription } from '@/components/builder/elements/woo/ArchiveDescription';
import { ArchiveCategories } from '@/components/builder/elements/woo/ArchiveCategories';
import { ShoppingCartPage } from '@/components/builder/elements/woo/ShoppingCartPage';
import { CheckoutPage } from '@/components/builder/elements/woo/CheckoutPage';
import { MyAccount } from '@/components/builder/elements/woo/MyAccount';
import { CartTotal } from '@/components/builder/elements/woo/CartTotal';
import { OrderTracking } from '@/components/builder/elements/woo/OrderTracking';
// Batch 8: Remaining OxyUltimate
import { UltimateImage } from '@/components/builder/elements/enhanced/UltimateImage';
import { UltimateVideo } from '@/components/builder/elements/enhanced/UltimateVideo';

const ELEMENTS = [
  { name: 'Container', icon: Square, component: Container, category: 'Layout' },
  { name: 'Section', icon: Layout, component: Section, category: 'Layout' },
  { name: 'CSS Grid', icon: LayoutGrid, component: CSSGrid, category: 'Layout' },
  { name: 'Div Block', icon: Square, component: DivBlock, category: 'Layout' },
  { name: 'Columns', icon: LayoutGrid, component: NewColumns, category: 'Layout' },
  { name: 'Accordion', icon: Layout, component: Accordion, category: 'Layout' },
  { name: 'Slider', icon: Image, component: Slider, category: 'Layout' },
  { name: 'Test Element', icon: Square, component: TestElement, category: 'Debug' },
  { name: 'Text', icon: Type, component: Text, category: 'Basic' },
  { name: 'Heading', icon: Heading, component: HeadingEl, category: 'Basic' },
  { name: 'Animated Heading', icon: Type, component: AnimatedHeading, category: 'Enhanced' },
  { name: 'Dual Color Text', icon: Type, component: DualColorText, category: 'Enhanced' },
  { name: 'Image', icon: Image, component: ImageEl, category: 'Basic' },
  { name: 'Button', icon: MousePointer, component: Button, category: 'Basic' },
  { name: 'Dual Button', icon: MousePointer, component: DualButton, category: 'Enhanced' },
  { name: 'ProductCard', icon: Package, component: ProductCard, category: 'Shop' },
  { name: 'ProductGrid', icon: LayoutGrid, component: ProductGrid, category: 'Shop' },
  { name: 'Repeater', icon: Repeat, component: Repeater, category: 'Layout' },
  { name: 'AddToCartButton', icon: ShoppingCart, component: AddToCartButton, category: 'Shop' },
  { name: 'PriceDisplay', icon: DollarSign, component: PriceDisplay, category: 'Shop' },
  { name: 'CategoryList', icon: List, component: CategoryList, category: 'Shop' },
  { name: 'Hotspot', icon: MapPin, component: Hotspot, category: 'Enhanced' },
  { name: 'Before After', icon: Image, component: BeforeAfter, category: 'Enhanced' },
  { name: 'Content Slider', icon: Image, component: ContentSlider, category: 'Enhanced' },
  { name: 'Alert Box', icon: Type, component: AlertBox, category: 'Enhanced' },
  { name: 'Back to Top', icon: Type, component: BackToTop, category: 'Enhanced' },
  { name: 'Burger Trigger', icon: Type, component: BurgerTrigger, category: 'Enhanced' },
  { name: 'Carousel Builder', icon: Image, component: CarouselBuilder, category: 'Enhanced' },
  { name: 'Cart Counter', icon: ShoppingCart, component: CartCounter, category: 'Enhanced' },
  { name: 'Circular Progress', icon: Type, component: CircularProgress, category: 'Enhanced' },
  // Batch 1: Core Oxygen Elements
  { name: 'Video', icon: Play, component: Video, category: 'Basic' },
  { name: 'Gallery', icon: Grid3X3, component: Gallery, category: 'Basic' },
  { name: 'Icon Box', icon: Box, component: IconBox, category: 'Basic' },
  { name: 'Tabs', icon: PanelTop, component: TabsEl, category: 'Layout' },
  { name: 'Modal', icon: Layers, component: Modal, category: 'Enhanced' },
  { name: 'Link Button', icon: Link, component: LinkButton, category: 'Basic' },
  { name: 'Link Text', icon: Link2, component: LinkText, category: 'Basic' },
  { name: 'Link Wrapper', icon: Link, component: LinkWrapper, category: 'Layout' },
  { name: 'Rich Text', icon: FileText, component: RichText, category: 'Basic' },
  { name: 'Code Block', icon: FileCode, component: CodeBlock, category: 'Basic' },
  { name: 'Progress Bar', icon: BarChart3, component: ProgressBar, category: 'Basic' },
  { name: 'Testimonial', icon: Quote, component: Testimonial, category: 'Basic' },
  { name: 'Pricing Box', icon: CreditCard, component: PricingBox, category: 'Basic' },
  { name: 'Social Icons', icon: Share2, component: SocialIcons, category: 'Basic' },
  { name: 'Map', icon: Map, component: MapEmbed, category: 'Basic' },
  { name: 'Search Form', icon: Search, component: SearchForm, category: 'Basic' },
  { name: 'Login Form', icon: LogIn, component: LoginForm, category: 'Basic' },
  { name: 'Toggle', icon: ToggleLeft, component: Toggle, category: 'Layout' },
  { name: 'Superbox', icon: Sparkles, component: Superbox, category: 'Enhanced' },
  { name: 'Shape Divider', icon: ChevronDown, component: ShapeDivider, category: 'Layout' },
  { name: 'Menu', icon: MenuIcon, component: MenuEl, category: 'Layout' },
  { name: 'Fancy Icon', icon: Star, component: FancyIcon, category: 'Basic' },
  // Batch 2: OxyUltimate
  { name: 'Countdown', icon: Timer, component: Countdown, category: 'Enhanced' },
  { name: 'Fancy Heading', icon: Highlighter, component: FancyHeading, category: 'Enhanced' },
  { name: 'Highlighted Heading', icon: Highlighter, component: HighlightedHeading, category: 'Enhanced' },
  { name: 'Icon List', icon: ListChecks, component: IconList, category: 'Enhanced' },
  { name: 'Tooltip', icon: Info, component: Tooltip, category: 'Enhanced' },
  { name: 'Rating', icon: Star, component: Rating, category: 'Enhanced' },
  { name: 'Off Canvas', icon: PanelRight, component: OffCanvas, category: 'Enhanced' },
  { name: 'Lightbox', icon: Maximize, component: Lightbox, category: 'Enhanced' },
  { name: 'Hover Animated Button', icon: Zap, component: HoverAnimatedButton, category: 'Enhanced' },
  { name: 'Image Mask', icon: Hexagon, component: ImageMask, category: 'Enhanced' },
  { name: 'Image Panels', icon: GalleryHorizontal, component: ImagePanels, category: 'Enhanced' },
  { name: 'Show More/Less', icon: Eye, component: ShowMoreLess, category: 'Enhanced' },
  { name: 'Sliding Menu', icon: SlidersHorizontal, component: SlidingMenu, category: 'Enhanced' },
  { name: 'Gallery Slider', icon: GalleryHorizontal, component: GallerySlider, category: 'Enhanced' },
  // Batch 3: OxyExtras
  { name: 'Counter', icon: Hash, component: Counter, category: 'Extras' },
  { name: 'Content Switcher', icon: ArrowLeftRight, component: ContentSwitcher, category: 'Extras' },
  { name: 'Content Timeline', icon: Clock, component: ContentTimeline, category: 'Extras' },
  { name: 'Copy to Clipboard', icon: Clipboard, component: CopyToClipboard, category: 'Extras' },
  { name: 'Reading Progress Bar', icon: Activity, component: ReadingProgressBar, category: 'Extras' },
  { name: 'Social Share Buttons', icon: Share, component: SocialShareButtons, category: 'Extras' },
  { name: 'Table of Contents', icon: BookOpen, component: TableOfContents, category: 'Extras' },
  { name: 'Preloader', icon: Loader, component: Preloader, category: 'Extras' },
  { name: 'Toggle Switch', icon: ToggleRight, component: ToggleSwitch, category: 'Extras' },
  { name: 'Copyright Year', icon: Copyright, component: CopyrightYear, category: 'Extras' },
  { name: 'Header Search', icon: SearchIcon, component: HeaderSearch, category: 'Extras' },
  { name: 'Media Player', icon: PlayCircle, component: MediaPlayer, category: 'Extras' },
  // Batch 4: WooCommerce
  { name: 'Product Images', icon: ImageIcon, component: ProductImages, category: 'Shop' },
  { name: 'Product Title', icon: Tag, component: ProductTitle, category: 'Shop' },
  { name: 'Product Price', icon: DollarSign, component: ProductPrice, category: 'Shop' },
  { name: 'Product Description', icon: FileTextIcon, component: ProductDescription, category: 'Shop' },
  { name: 'Product Cart Button', icon: ShoppingBag, component: ProductCartButton, category: 'Shop' },
  { name: 'Product Rating', icon: StarIcon, component: ProductRating, category: 'Shop' },
  { name: 'Product Meta', icon: Tags, component: ProductMeta, category: 'Shop' },
  { name: 'Product Tabs', icon: PanelTopClose, component: ProductTabs, category: 'Shop' },
  { name: 'Product Stock', icon: PackageCheck, component: ProductStock, category: 'Shop' },
  { name: 'Mini Cart', icon: ShoppingCartIcon, component: MiniCart, category: 'Shop' },
  { name: 'Breadcrumb', icon: Navigation, component: Breadcrumb, category: 'Shop' },
  // Batch 5: Remaining Oxygen Core
  { name: 'Text Block', icon: FileText, component: TextBlock, category: 'Basic' },
  { name: 'Span', icon: Minus, component: Span, category: 'Basic' },
  { name: 'List', icon: ListOrdered, component: ListItem, category: 'Basic' },
  { name: 'Header', icon: PanelTopOpen, component: HeaderEl, category: 'Layout' },
  { name: 'Header Row', icon: Rows3, component: HeaderRow, category: 'Layout' },
  { name: 'Easy Posts', icon: Newspaper, component: EasyPosts, category: 'Layout' },
  { name: 'Dynamic List', icon: ListTree, component: DynamicList, category: 'Layout' },
  { name: 'SVG Icon', icon: Smile, component: SVGIcon, category: 'Basic' },
  // Batch 6: Remaining OxyExtras
  { name: 'Adjacent Posts', icon: ArrowRightLeft, component: AdjacentPosts, category: 'Extras' },
  { name: 'Author Box', icon: User, component: AuthorBox, category: 'Extras' },
  { name: 'Dynamic Tabs', icon: PanelLeftOpen, component: DynamicTabs, category: 'Extras' },
  { name: 'Mega Menu', icon: LayoutList, component: MegaMenu, category: 'Extras' },
  { name: 'Reading Time', icon: BookOpenCheck, component: ReadingTime, category: 'Extras' },
  { name: 'Post Terms', icon: TagsIcon, component: PostTerms, category: 'Extras' },
  { name: 'Infinite Scroller', icon: ScrollText, component: InfiniteScroller, category: 'Extras' },
  // Batch 7: Remaining WooCommerce
  { name: 'Product Excerpt', icon: FileTextIcon, component: ProductExcerpt, category: 'Shop' },
  { name: 'Product Related', icon: Link2, component: ProductRelated, category: 'Shop' },
  { name: 'Product Upsells', icon: ArrowUpRight, component: ProductUpsells, category: 'Shop' },
  { name: 'Product Cross-sells', icon: Shuffle, component: ProductCrosssells, category: 'Shop' },
  { name: 'Archive Products', icon: Grid3X3, component: ArchiveProducts, category: 'Shop' },
  { name: 'Archive Title', icon: Heading1, component: ArchiveTitle, category: 'Shop' },
  { name: 'Archive Description', icon: AlignLeft, component: ArchiveDescription, category: 'Shop' },
  { name: 'Archive Categories', icon: FolderOpen, component: ArchiveCategories, category: 'Shop' },
  { name: 'Shopping Cart Page', icon: ShoppingCart, component: ShoppingCartPage, category: 'Shop' },
  { name: 'Checkout Page', icon: CreditCard, component: CheckoutPage, category: 'Shop' },
  { name: 'My Account', icon: UserCircle, component: MyAccount, category: 'Shop' },
  { name: 'Cart Total', icon: Calculator, component: CartTotal, category: 'Shop' },
  { name: 'Order Tracking', icon: SearchIcon, component: OrderTracking, category: 'Shop' },
  // Batch 8: Remaining OxyUltimate
  { name: 'Ultimate Image', icon: ImagePlus, component: UltimateImage, category: 'Enhanced' },
  { name: 'Ultimate Video', icon: Film, component: UltimateVideo, category: 'Enhanced' },
];

export const ComponentPalette = ({ onClose, canvasTargetId: canvasTargetIdProp }) => {
  const { query, actions } = useEditor();
  const { saveState } = useUndoRedo();

  // Prefer 'ROOT' (Craft.js root key); fallback to any node with no parent
  const getCanvasTargetId = () => {
    try {
      const state = query.getState();
      const nodes = state?.nodes || {};
      if (!nodes || Object.keys(nodes).length === 0) return null;
      const rootId =
        (nodes['ROOT']?.data && 'ROOT') ||
        (nodes[ROOT_NODE]?.data && ROOT_NODE) ||
        Object.keys(nodes).find((id) => nodes[id]?.data && (nodes[id].data.parent == null));
      if (!rootId) return null;
      const childIds = nodes[rootId]?.data?.nodes || [];
      if (childIds.length === 0) return null;
      const canvasId =
        childIds.find((id) => nodes[id]?.data?.isCanvas === true) || childIds[0] || null;
      return canvasId && nodes[canvasId] ? canvasId : null;
    } catch {
      return null;
    }
  };

  const getCanvasTargetIdFromQuery = () => {
    try {
      const root = query.node(ROOT_NODE).get();
      if (!root?.data?.nodes?.length) return null;
      const childIds = root.data.nodes;
      const nodes = query.getState()?.nodes || {};
      const canvasId =
        childIds.find((id) => nodes[id]?.data?.isCanvas === true) || childIds[0] || null;
      return canvasId && nodes[canvasId] ? canvasId : null;
    } catch {
      return null;
    }
  };

  const parentExistsInState = (parentId) => {
    if (!parentId) return false;
    try {
      const nodes = query.getState()?.nodes || {};
      return Boolean(nodes[parentId]);
    } catch {
      return false;
    }
  };

  const resolveParentId = () => {
    if (canvasTargetIdProp && parentExistsInState(canvasTargetIdProp)) return canvasTargetIdProp;
    return getCanvasTargetId() ?? getCanvasTargetIdFromQuery();
  };

  const handleAdd = (El, defaultProps = {}) => {
    const doAdd = (parentId) => {
      if (!parentId) {
        toast.error('Canvas not ready. Try again in a moment or refresh the page.');
        return;
      }
      if (!parentExistsInState(parentId)) {
        toast.error('Canvas not ready. Try again in a moment or refresh the page.');
        return;
      }
      actions.clearEvents();
      try {
        const nodeTree = query.parseReactElement(React.createElement(El, defaultProps)).toNodeTree();
        actions.addNodeTree(nodeTree, parentId);
      } catch (e) {
        console.error('Add component failed:', e);
        toast.error('Could not add element');
        return;
      }
      try {
        saveState();
      } catch (_) {}
      toast.success('Element added');
      onClose?.();
    };

    const tryAdd = (attempt = 0) => {
      const maxAttempts = 25;
      const delay = attempt === 0 ? 80 : Math.min(60 * Math.pow(1.4, attempt), 500);
      const run = () => {
        const parentId = resolveParentId();
        if (parentId) {
          doAdd(parentId);
          return;
        }
        if (attempt < maxAttempts) {
          setTimeout(() => tryAdd(attempt + 1), delay);
        } else {
          doAdd(null);
        }
      };
      setTimeout(run, delay);
    };

    try {
      tryAdd(0);
    } catch (e) {
      console.error('Add component failed:', e);
      toast.error('Could not add element');
    }
  };

  const byCategory = ELEMENTS.reduce((acc, el) => {
    (acc[el.category] = acc[el.category] || []).push(el);
    return acc;
  }, {});

  return (
    <div className="bg-white h-full flex flex-col min-h-0">
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">Add</h3>
        {onClose != null && (
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-2">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">{category}</h4>
            <div className="space-y-0.5">
              {items.map(({ name, icon: Icon, component, category: _cat }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const defaults = component.craft?.props || {};
                    handleAdd(component, defaults);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Icon size={16} className="text-gray-500" />
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
