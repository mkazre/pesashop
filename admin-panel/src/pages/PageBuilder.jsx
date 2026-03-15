/**
 * Page Builder - Oxygen-style layout: Structure (left), Canvas (center), Settings (right), + Add panel.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { pageTemplatesAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { ChevronLeft, Save, ChevronDown, ChevronUp, Undo2, Redo2, Layers, Monitor, Tablet, Smartphone, Plus, X } from 'lucide-react';

import { RenderNode } from '@/components/builder/utils/RenderNode';
import { Container } from '@/components/builder/elements/Container';
import { Section } from '@/components/builder/elements/Section';
import { Text } from '@/components/builder/elements/Text';
import { Heading } from '@/components/builder/elements/Heading';
import { Image } from '@/components/builder/elements/Image';
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
import { CSSGrid } from '@/components/builder/elements/enhanced/CSSGrid';
import { AlertBox } from '@/components/builder/elements/enhanced/AlertBox';
import { BackToTop } from '@/components/builder/elements/enhanced/BackToTop';
import { BurgerTrigger } from '@/components/builder/elements/enhanced/BurgerTrigger';
import { CarouselBuilder } from '@/components/builder/elements/enhanced/CarouselBuilder';
import { CartCounter } from '@/components/builder/elements/enhanced/CartCounter';
import { CircularProgress } from '@/components/builder/elements/enhanced/CircularProgress';
import { DivBlock } from '@/components/builder/elements/enhanced/DivBlock';
import { NewColumns } from '@/components/builder/elements/enhanced/NewColumns';
import { Column } from '@/components/builder/elements/enhanced/Column';
import { Accordion } from '@/components/builder/elements/enhanced/Accordion';
import { Slider } from '@/components/builder/elements/enhanced/Slider';
import { TestElement } from '@/components/builder/elements/TestElement';
import { Video } from '@/components/builder/elements/Video';
import { Gallery } from '@/components/builder/elements/Gallery';
import { IconBox } from '@/components/builder/elements/IconBox';
import { Tabs } from '@/components/builder/elements/Tabs';
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
import { Menu } from '@/components/builder/elements/Menu';
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
import UIButton from '@/components/common/Button';
import { DOMTree } from '@/components/builder/panels/DOMTree';
import { SettingsPanel } from '@/components/builder/panels/SettingsPanel';
import { ComponentPalette } from '@/components/builder/panels/ComponentPalette';
import { HistoryPanel } from '@/components/builder/panels/HistoryPanel';
import { NestingGuide } from '@/components/builder/panels/NestingGuide';
import { useUndoRedo } from '@/components/builder/utils/UndoRedo';
import { BreakpointProvider } from '@/components/builder/context/BreakpointContext';
import { DropZoneIndicator } from '@/components/builder/utils/DropZoneIndicator';
import { HistoryProvider, useHistory } from '@/components/builder/context/HistoryContext';

const resolver = {
  Container,
  Section,
  Text,
  Heading,
  Image,
  Button,
  ProductCard,
  ProductGrid,
  Repeater,
  AddToCartButton,
  PriceDisplay,
  CategoryList,
  Hotspot,
  BeforeAfter,
  AnimatedHeading,
  DualButton,
  DualColorText,
  ContentSlider,
  CSSGrid,
  AlertBox,
  BackToTop,
  BurgerTrigger,
  CarouselBuilder,
  CartCounter,
  CircularProgress,
  DivBlock,
  NewColumns,
  Column,
  Accordion,
  Slider,
  TestElement,
  Video,
  Gallery,
  IconBox,
  Tabs,
  Modal,
  LinkButton,
  LinkText,
  LinkWrapper,
  RichText,
  CodeBlock,
  ProgressBar,
  Testimonial,
  PricingBox,
  SocialIcons,
  MapEmbed,
  SearchForm,
  LoginForm,
  Toggle,
  Superbox,
  ShapeDivider,
  Menu,
  FancyIcon,
  // Batch 2: OxyUltimate
  Countdown,
  FancyHeading,
  HighlightedHeading,
  IconList,
  Tooltip,
  Rating,
  OffCanvas,
  Lightbox,
  HoverAnimatedButton,
  ImageMask,
  ImagePanels,
  ShowMoreLess,
  SlidingMenu,
  GallerySlider,
  // Batch 3: OxyExtras
  Counter,
  ContentSwitcher,
  ContentTimeline,
  CopyToClipboard,
  ReadingProgressBar,
  SocialShareButtons,
  TableOfContents,
  Preloader,
  ToggleSwitch,
  CopyrightYear,
  HeaderSearch,
  MediaPlayer,
  // Batch 4: WooCommerce
  ProductImages,
  ProductTitle,
  ProductPrice,
  ProductDescription,
  ProductCartButton,
  ProductRating,
  ProductMeta,
  ProductTabs,
  ProductStock,
  MiniCart,
  Breadcrumb,
  // Batch 5: Remaining Oxygen Core
  TextBlock,
  Span,
  ListItem,
  Header: HeaderEl,
  HeaderRow,
  EasyPosts,
  DynamicList,
  SVGIcon,
  // Batch 6: Remaining OxyExtras
  AdjacentPosts,
  AuthorBox,
  DynamicTabs,
  MegaMenu,
  ReadingTime,
  PostTerms,
  InfiniteScroller,
  // Batch 7: Remaining WooCommerce
  ProductExcerpt,
  ProductRelated,
  ProductUpsells,
  ProductCrosssells,
  ArchiveProducts,
  ArchiveTitle,
  ArchiveDescription,
  ArchiveCategories,
  ShoppingCartPage,
  CheckoutPage,
  MyAccount,
  CartTotal,
  OrderTracking,
  // Batch 8: Remaining OxyUltimate
  UltimateImage,
  UltimateVideo,
};

const LEFT_PANEL_WIDTH = 280;
const RIGHT_PANEL_WIDTH = 320;
const ADD_PANEL_WIDTH = 280;

// Stable ID for the default canvas container so add/drop resolution is predictable.
const DEFAULT_CANVAS_NODE_ID = 'canvas-default';

// Pre-built serialized empty canvas. Frame always receives `data` (this or saved) so editor state
// exists from first render and "Canvas not ready" is avoided. Format matches Craft.js SerializedNodes.
const DEFAULT_SERIALIZED_STATE = {
  ROOT: {
    type: { resolvedName: 'Container' },
    isCanvas: false,
    props: {},
    parent: null,
    nodes: [DEFAULT_CANVAS_NODE_ID],
    displayName: 'Container',
    linkedNodes: {},
    hidden: false,
    custom: {},
  },
  [DEFAULT_CANVAS_NODE_ID]: {
    type: { resolvedName: 'Container' },
    isCanvas: true,
    props: { className: 'min-h-[400px] bg-white rounded shadow p-6' },
    parent: 'ROOT',
    nodes: [],
    displayName: 'Container',
    linkedNodes: {},
    hidden: false,
    custom: {},
  },
};

// Fallback when using children (kept for reference). Prefer data so state is ready immediately.
const DEFAULT_FRAME_CONTENT = (
  <Element is={Container} canvas className="min-h-[400px] bg-white rounded shadow p-6" />
);

/**
 * Stable component (defined at module level) so React does not unmount/remount it when
 * PageBuilder re-renders. If this lived inside PageBuilder, each re-render would create
 * a new component type, Frame would remount and re-run its init with default children,
 * wiping the editor state and leaving the canvas blank while Structure still showed nodes.
 */
function PageBuilderInner({
  leftTab,
  setLeftTab,
  expandTree,
  setExpandTree,
  collapseTree,
  setCollapseTree,
  showAddPanel,
  setShowAddPanel,
  breakpoint,
  setBreakpoint,
  hasInitialComponents,
  initialComponents,
  pageId,
  page,
  navigate,
  saveMutation,
  setIsSaving,
  isSaving,
  editorQueryRef,
}) {
  const { query } = useEditor();
  editorQueryRef.current = query;
  const { undo, redo, canUndo, canRedo, saveState } = useHistory();
  const canvasTargetId = useEditor((state) => {
    const nodes = state?.nodes || {};
    if (!nodes || Object.keys(nodes).length === 0) return null;
    const rootId =
      (nodes['ROOT']?.data && 'ROOT') ||
      Object.keys(nodes).find((id) => nodes[id]?.data && nodes[id].data.parent == null);
    if (!rootId) return null;
    const childIds = nodes[rootId]?.data?.nodes || [];
    if (childIds.length === 0) return null;
    return (
      childIds.find((id) => nodes[id]?.data?.isCanvas === true) || childIds[0] || null
    );
  });
  const initialDataRef = React.useRef(null);
  React.useEffect(() => {
    initialDataRef.current = null;
  }, [pageId]);
  const frameData = hasInitialComponents
    ? (initialDataRef.current !== null ? initialDataRef.current : (initialDataRef.current = initialComponents))
    : DEFAULT_SERIALIZED_STATE;
  React.useEffect(() => {
    try {
      saveState();
    } catch (_) {}
  }, []);

  const handleSave = () => {
    if (!editorQueryRef.current) return;
    setIsSaving(true);
    try {
      const json = editorQueryRef.current.serialize();
      console.log('Saving page data:', json);
      console.log('Page ID:', pageId);
      
      // Debug: Check if our text changes are in the saved data
      const nodes = json?.nodes || {};
      Object.keys(nodes).forEach(nodeId => {
        const node = nodes[nodeId];
        if (node?.data?.props?.content) {
          console.log(`Node ${nodeId} content:`, node.data.props.content);
        }
      });
      
      saveMutation.mutate(json);
    } catch (e) {
      console.error('Save failed', e);
      setIsSaving(false);
    }
  };

  const importInputRef = React.useRef(null);
  const handleImport = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = typeof reader.result === 'string' ? JSON.parse(reader.result) : reader.result;
        if (actions?.deserialize) actions.deserialize(json);
        toast.success('Structure imported');
      } catch (err) {
        toast.error('Invalid JSON');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full relative">
      <DropZoneIndicator />
      {/* Top bar: Back, + Add, breakpoints, Undo/Redo, page name, Save */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/page-manager')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <button
            type="button"
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 text-sm font-medium"
          >
            <Plus size={18} />
            Add
          </button>
          <div className="flex items-center gap-0.5 ml-2 border border-gray-200 rounded overflow-hidden">
            <button
              type="button"
              onClick={() => setBreakpoint('desktop')}
              className={`p-1.5 ${breakpoint === 'desktop' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
            <button
              type="button"
              onClick={() => setBreakpoint('tablet')}
              className={`p-1.5 ${breakpoint === 'tablet' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Tablet"
            >
              <Tablet size={16} />
            </button>
            <button
              type="button"
              onClick={() => setBreakpoint('phone')}
              className={`p-1.5 ${breakpoint === 'phone' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Phone"
            >
              <Smartphone size={16} />
            </button>
          </div>
          <button type="button" onClick={undo} disabled={!canUndo} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40" title="Undo">
            <Undo2 size={18} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40" title="Redo">
            <Redo2 size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{page?.templateType || ''}</span>
          <span className="text-sm text-gray-500 font-medium">{page?.name || 'Page'}</span>
          <UIButton onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </UIButton>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel: Structure | History only */}
        <div
          className="border-r bg-[#1e1e1e] flex flex-col shrink-0 overflow-hidden"
          style={{ width: LEFT_PANEL_WIDTH }}
        >
          <div className="flex border-b border-gray-700 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('structure')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                leftTab === 'structure' ? 'bg-gray-700 text-white border-b-2 border-primary' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Structure
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('history')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                leftTab === 'history' ? 'bg-gray-700 text-white border-b-2 border-primary' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('nesting')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                leftTab === 'nesting' ? 'bg-gray-700 text-white border-b-2 border-primary' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              Nesting
            </button>
          </div>
          <div className="flex-1 overflow-auto flex flex-col min-h-0">
            {leftTab === 'structure' && (
              <>
                <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between shrink-0">
                  <span className="text-sm font-semibold text-gray-200">Structure</span>
                  <div className="flex items-center gap-1">
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleImport}
                    />
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      className="px-2 py-1 text-xs rounded hover:bg-gray-700 text-gray-300"
                    >
                      Import
                    </button>
                    <button type="button" onClick={() => setExpandTree((n) => n + 1)} className="p-1 rounded hover:bg-gray-700 text-gray-400" title="Expand All">
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" onClick={() => setCollapseTree((n) => n + 1)} className="p-1 rounded hover:bg-gray-700 text-gray-400" title="Collapse All">
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  <DOMTree expandAll={expandTree} collapseAll={collapseTree} />
                </div>
              </>
            )}
            {leftTab === 'history' && (
              <HistoryPanel />
            )}
            {leftTab === 'nesting' && (
              <NestingGuide />
            )}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Preview: <span className="font-medium capitalize">{breakpoint}</span>
              {breakpoint !== 'desktop' && (
                <span className="ml-2 text-xs text-gray-500">
                  ({breakpoint === 'tablet' ? '768px' : '375px'} width)
                </span>
              )}
            </div>
          </div>
          <div
            className={breakpoint !== 'desktop' ? 'border-2 border-dashed border-gray-300 bg-white shadow-sm' : ''}
            style={breakpoint !== 'desktop' ? {
              maxWidth: breakpoint === 'tablet' ? '768px' : '375px',
              margin: '0 auto',
              transition: 'max-width 0.3s ease',
            } : undefined}
          >
            {breakpoint !== 'desktop' && (
              <div className="text-xs text-gray-500 p-2 text-center border-b bg-gray-50">
                {breakpoint === 'tablet' ? 'Tablet View' : 'Mobile View'}
              </div>
            )}
            <div className={breakpoint !== 'desktop' ? 'p-4' : ''}>
              <Frame data={frameData} />
            </div>
          </div>
        </div>

        {/* Right panel: Settings (Oxygen-style) */}
        <div
          className="border-l bg-white flex flex-col shrink-0 overflow-hidden"
          style={{ width: RIGHT_PANEL_WIDTH }}
        >
          <SettingsPanel />
        </div>
      </div>

      {/* Add panel: slide-out overlay (opens from + Add only) */}
      {showAddPanel && (
        <>
          <div className="absolute inset-0 bg-black/30 z-40" onClick={() => setShowAddPanel(false)} aria-hidden="true" />
          <div
            className="absolute top-0 left-0 bottom-0 w-[280px] bg-white border-r shadow-xl z-50 flex flex-col"
            style={{ width: ADD_PANEL_WIDTH }}
          >
            <div className="flex items-center justify-between p-3 border-b shrink-0">
              <span className="text-sm font-semibold text-gray-800">Add</span>
              <button type="button" onClick={() => setShowAddPanel(false)} className="p-1 rounded hover:bg-gray-100 text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <ComponentPalette onClose={() => setShowAddPanel(false)} canvasTargetId={canvasTargetId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PageBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageId = searchParams.get('page');
  const [isSaving, setIsSaving] = useState(false);
  const [leftTab, setLeftTab] = useState('structure');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [expandTree, setExpandTree] = useState(0);
  const [collapseTree, setCollapseTree] = useState(0);
  const editorQueryRef = useRef(null);

  useEffect(() => {
    if (!pageId) {
      navigate('/page-manager', { replace: true });
    }
  }, [pageId, navigate]);

  const {
    data: pageResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(
    ['page-template', pageId],
    () => pageTemplatesAPI.getOne(pageId),
    { enabled: !!pageId, retry: 1 }
  );

  const page = pageResponse?.data?.data;
  const rawComponents = page?.components;
  const initialComponents = (() => {
    let data = {};
    if (rawComponents && typeof rawComponents === 'object' && rawComponents !== null) data = rawComponents;
    else if (typeof rawComponents === 'string') {
      try {
        data = JSON.parse(rawComponents);
      } catch {
        data = {};
      }
    }
    if (!data || typeof data !== 'object') return {};
    const keys = Object.keys(data);
    if (keys.length === 0) return {};
    const hasRoot = keys.some((k) => k === 'ROOT' || (data[k] && data[k].data && data[k].data.parent === undefined));
    if (!hasRoot) return {};
    const str = JSON.stringify(data);
    if (str.includes('Loading page...')) return {};
    return data;
  })();

  const saveMutation = useMutation(
    (components) => pageTemplatesAPI.update(pageId, { components }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['page-template', pageId]);
        queryClient.invalidateQueries('page-templates');
        toast.success('Page saved successfully');
        setIsSaving(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error || 'Failed to save page');
        setIsSaving(false);
      },
    }
  );

  const hasInitialComponents = initialComponents && Object.keys(initialComponents).length > 0;

  if (!pageId) return null;
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-gray-500 text-sm">Loading page...</p>
      </div>
    );
  }
  if (isError) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Failed to load page. Check the backend is running and you are logged in.';
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <p className="text-red-600 mb-4">{message}</p>
        <div className="flex gap-3 justify-center">
          <UIButton onClick={() => refetch()}>Retry</UIButton>
          <UIButton variant="ghost" onClick={() => navigate('/page-manager')}>
            Back to Page Manager
          </UIButton>
        </div>
      </div>
    );
  }
  if (!page) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Page not found.</p>
        <UIButton onClick={() => navigate('/page-manager')} className="mt-4">
          Back to Page Manager
        </UIButton>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <BreakpointProvider breakpoint={breakpoint} setBreakpoint={setBreakpoint}>
        <Editor resolver={resolver} onRender={RenderNode}>
          <HistoryProvider>
            <PageBuilderInner
              leftTab={leftTab}
              setLeftTab={setLeftTab}
              showAddPanel={showAddPanel}
              setShowAddPanel={setShowAddPanel}
              breakpoint={breakpoint}
              setBreakpoint={setBreakpoint}
              expandTree={expandTree}
              setExpandTree={setExpandTree}
              collapseTree={collapseTree}
              setCollapseTree={setCollapseTree}
              hasInitialComponents={hasInitialComponents}
              initialComponents={initialComponents}
              pageId={pageId}
              page={page}
              navigate={navigate}
              saveMutation={saveMutation}
              setIsSaving={setIsSaving}
              isSaving={isSaving}
              editorQueryRef={editorQueryRef}
            />
          </HistoryProvider>
        </Editor>
      </BreakpointProvider>
    </div>
  );
};

export default PageBuilder;
