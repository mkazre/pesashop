// Comprehensive nesting rules system based on Oxygen Builder principles
// Elements are categorized by their nesting capabilities

export const ELEMENT_CATEGORIES = {
  // Structural elements — can contain other elements (isCanvas: true)
  STRUCTURAL: [
    'Container', 'Section', 'DivBlock', 'Div Block', 'NewColumns', 'Column', 'CSSGrid',
    'Header', 'HeaderRow', 'Modal', 'Superbox', 'LinkWrapper',
    'Tabs', 'Accordion', 'Slider', 'Toggle',
    'OffCanvas', 'MegaMenu', 'SlidingMenu',
    'CarouselBuilder', 'ContentSlider',
    'DynamicList', 'EasyPosts', 'Repeater',
  ],

  // Text elements — leaf nodes, only text content
  TEXT_ONLY: [
    'Text', 'Heading', 'RichText', 'TextBlock', 'CodeBlock', 'Span', 'ListItem',
    'LinkText', 'CopyrightYear', 'ReadingTime',
    'FancyHeading', 'HighlightedHeading', 'AnimatedHeading', 'DualColorText',
    'ArchiveTitle', 'ArchiveDescription',
    'ProductTitle', 'ProductPrice', 'ProductDescription', 'ProductExcerpt', 'ProductStock',
  ],

  // Media elements — leaf nodes
  MEDIA: [
    'Image', 'Video', 'Gallery', 'MapEmbed', 'FancyIcon', 'SVGIcon', 'IconBox',
    'UltimateImage', 'UltimateVideo', 'GallerySlider', 'ImageMask', 'ImagePanels',
    'MediaPlayer', 'Lightbox',
    'ProductImages',
  ],

  // Interactive elements — leaf nodes (buttons, forms, etc.)
  INTERACTIVE: [
    'Button', 'AddToCartButton', 'LinkButton', 'DualButton', 'HoverAnimatedButton',
    'LoginForm', 'SearchForm', 'HeaderSearch',
    'BackToTop', 'BurgerTrigger', 'CopyToClipboard',
    'ToggleSwitch', 'ShowMoreLess',
    'ProductCartButton',
    'ShoppingCartPage', 'CheckoutPage', 'MyAccount', 'OrderTracking',
  ],

  // Complex elements — self-contained components with internal structure
  COMPLEX: [
    'ProductCard', 'ProductGrid', 'CategoryList', 'PriceDisplay',
    'Testimonial', 'PricingBox', 'SocialIcons', 'SocialShareButtons',
    'ProgressBar', 'CircularProgress', 'ReadingProgressBar',
    'Countdown', 'Counter', 'Rating', 'CartCounter',
    'Breadcrumb', 'CartTotal', 'MiniCart',
    'TableOfContents', 'ContentTimeline', 'ContentSwitcher',
    'InfiniteScroller', 'Preloader', 'DynamicTabs',
    'Menu', 'ShapeDivider',
    'ProductRating', 'ProductMeta', 'ProductTabs',
    'ProductRelated', 'ProductUpsells', 'ProductCrosssells',
    'ArchiveProducts', 'ArchiveCategories',
    'AdjacentPosts', 'AuthorBox', 'PostTerms',
  ],

  // Enhanced elements — special visual components (leaf nodes)
  ENHANCED: [
    'Hotspot', 'BeforeAfter', 'AlertBox',
    'IconList', 'Tooltip',
    'TestElement',
  ],
};

// Derived sets
const CONTAINER_TYPES = new Set(ELEMENT_CATEGORIES.STRUCTURAL);

export const NESTING_RULES = {
  canContainChildren: [...ELEMENT_CATEGORIES.STRUCTURAL],
  cannotContainChildren: [
    ...ELEMENT_CATEGORIES.TEXT_ONLY,
    ...ELEMENT_CATEGORIES.MEDIA,
    ...ELEMENT_CATEGORIES.INTERACTIVE,
    ...ELEMENT_CATEGORIES.COMPLEX,
    ...ELEMENT_CATEGORIES.ENHANCED,
  ],
};

// Helper functions for nesting validation
export const getElementCategory = (elementType) => {
  if (!elementType) return 'UNKNOWN';
  for (const [category, elements] of Object.entries(ELEMENT_CATEGORIES)) {
    if (elements.includes(elementType)) return category;
  }
  return 'UNKNOWN';
};

export const canElementContainChildren = (elementType) => {
  return CONTAINER_TYPES.has(elementType);
};

export const canElementBeNested = (elementType, parentElementType) => {
  // Any element can be nested into a container-type parent
  return canElementContainChildren(parentElementType);
};

export const isValidNesting = (childType, parentType) => {
  if (childType === parentType) return false;
  if (!canElementContainChildren(parentType)) return false;
  return canElementBeNested(childType, parentType);
};

export const getNestingErrorMessage = (childType, parentType) => {
  if (childType === parentType) {
    return `Cannot nest ${childType} into another ${childType}`;
  }
  if (!canElementContainChildren(parentType)) {
    return `${parentType} cannot contain other elements`;
  }
  return `${childType} cannot be nested into ${parentType}`;
};

// Visual feedback for nesting
export const getNestingIndicator = (childType, parentType) => {
  const isValid = isValidNesting(childType, parentType);
  return {
    isValid,
    message: isValid ? null : getNestingErrorMessage(childType, parentType),
    color: isValid ? 'green' : 'red',
    icon: isValid ? '✓' : '✗',
  };
};

export default {
  ELEMENT_CATEGORIES,
  NESTING_RULES,
  getElementCategory,
  canElementContainChildren,
  canElementBeNested,
  isValidNesting,
  getNestingErrorMessage,
  getNestingIndicator,
};
