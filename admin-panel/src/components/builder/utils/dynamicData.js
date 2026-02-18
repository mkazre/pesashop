/**
 * Dynamic Data System — Oxygen Builder-style dynamic data binding for all elements.
 *
 * Binding format: "{{source.field}}" stored in node props.dynamicBindings map.
 * Example: { content: "{{product.name}}", src: "{{product.featuredImage}}" }
 *
 * Resolution: resolveDynamicValue("{{product.name}}", context) => "Nike Air Max"
 * Context comes from RepeaterContext (current item) or page-level data.
 */

// ─── Available Data Points ─────────────────────────────────────────────────
// Organized by source category, each with field key, label, type, and description.
// "type" determines which property inputs show this data point:
//   text   → content, title, heading, alt, label, buttonText, etc.
//   image  → src, backgroundImage, mainImage, featuredImage, etc.
//   url    → href, link, url, etc.
//   number → price, rating, stock, etc.
//   html   → rich text / HTML content
//   any    → available everywhere

export const DATA_POINT_CATEGORIES = [
  {
    id: 'product',
    label: 'Product',
    icon: 'ShoppingBag',
    description: 'Dynamic product data from Repeater',
    points: [
      { field: 'product.name',            label: 'Product Name',        type: 'text' },
      { field: 'product.slug',            label: 'Product Slug',        type: 'text' },
      { field: 'product.description',     label: 'Description',         type: 'html' },
      { field: 'product.shortDescription',label: 'Short Description',   type: 'text' },
      { field: 'product.regularPrice',    label: 'Regular Price',       type: 'number' },
      { field: 'product.salePrice',       label: 'Sale Price',          type: 'number' },
      { field: 'product.formattedPrice',  label: 'Formatted Price',     type: 'text' },
      { field: 'product.formattedSalePrice', label: 'Formatted Sale Price', type: 'text' },
      { field: 'product.featuredImage',   label: 'Featured Image',      type: 'image' },
      { field: 'product.images[0]',       label: 'First Gallery Image', type: 'image' },
      { field: 'product.images[1]',       label: 'Second Gallery Image',type: 'image' },
      { field: 'product.permalink',       label: 'Product Link',        type: 'url' },
      { field: 'product.sku',             label: 'SKU',                 type: 'text' },
      { field: 'product.brand',           label: 'Brand',               type: 'text' },
      { field: 'product.stockQuantity',   label: 'Stock Quantity',      type: 'number' },
      { field: 'product.rating',          label: 'Average Rating',      type: 'number' },
      { field: 'product.reviewCount',     label: 'Review Count',        type: 'number' },
      { field: 'product.categoryNames',   label: 'Category Names',      type: 'text' },
    ],
  },
  {
    id: 'category',
    label: 'Category',
    icon: 'FolderOpen',
    description: 'Dynamic category data from Repeater',
    points: [
      { field: 'category.name',           label: 'Category Name',       type: 'text' },
      { field: 'category.slug',           label: 'Category Slug',       type: 'text' },
      { field: 'category.description',    label: 'Description',         type: 'text' },
      { field: 'category.image',          label: 'Category Image',      type: 'image' },
      { field: 'category.permalink',      label: 'Category Link',       type: 'url' },
      { field: 'category.productCount',   label: 'Product Count',       type: 'number' },
    ],
  },
  {
    id: 'page',
    label: 'Page / Site',
    icon: 'Globe',
    description: 'Current page and site-level data',
    points: [
      { field: 'page.title',              label: 'Page Title',          type: 'text' },
      { field: 'page.slug',               label: 'Page Slug',           type: 'text' },
      { field: 'site.name',               label: 'Site Name',           type: 'text' },
      { field: 'site.tagline',            label: 'Site Tagline',        type: 'text' },
      { field: 'site.url',                label: 'Site URL',            type: 'url' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom Field',
    icon: 'Code',
    description: 'Custom field from the current item',
    points: [
      { field: 'custom.',                 label: 'Custom Field Key…',   type: 'any', isCustom: true },
    ],
  },
];

// Flat lookup for quick access
export const ALL_DATA_POINTS = DATA_POINT_CATEGORIES.flatMap(cat =>
  cat.points.map(p => ({ ...p, category: cat.id, categoryLabel: cat.label }))
);

// ─── Type compatibility ────────────────────────────────────────────────────
// Which data point types are valid for which property kinds
const TYPE_COMPAT = {
  text:   ['text', 'number', 'html', 'any'],
  image:  ['image', 'any'],
  url:    ['url', 'text', 'any'],
  number: ['number', 'text', 'any'],
  html:   ['html', 'text', 'any'],
  color:  ['text', 'any'],
  any:    ['text', 'image', 'url', 'number', 'html', 'any'],
};

/**
 * Get data points compatible with a given property type.
 * @param {'text'|'image'|'url'|'number'|'html'|'color'|'any'} propType
 */
export function getDataPointsForType(propType = 'any') {
  const allowed = TYPE_COMPAT[propType] || TYPE_COMPAT.any;
  return ALL_DATA_POINTS.filter(p => allowed.includes(p.type) || p.type === 'any');
}

// ─── Token helpers ─────────────────────────────────────────────────────────

export const DYNAMIC_TOKEN_REGEX = /^\{\{(.+?)\}\}$/;
export const DYNAMIC_TOKEN_INLINE_REGEX = /\{\{(.+?)\}\}/g;

export function isDynamicValue(value) {
  return typeof value === 'string' && DYNAMIC_TOKEN_REGEX.test(value);
}

export function makeDynamicToken(field) {
  return `{{${field}}}`;
}

export function extractField(token) {
  const m = token.match(DYNAMIC_TOKEN_REGEX);
  return m ? m[1] : null;
}

// ─── Resolver ──────────────────────────────────────────────────────────────

/**
 * Resolve a single dynamic token against a context object.
 * Context shape: { product: {...}, category: {...}, page: {...}, site: {...} }
 *
 * The repeater item is normalized into context.product or context.category
 * depending on the repeater's dataSource setting.
 */
export function resolveDynamicValue(token, context = {}) {
  if (!isDynamicValue(token)) return token;

  const fieldPath = extractField(token);
  if (!fieldPath) return token;

  // Special computed fields — check BEFORE generic path resolution
  if (fieldPath === 'product.formattedPrice') {
    const p = context.product;
    return p ? `R ${(p.regularPrice || 0).toFixed(2)}` : '';
  }
  if (fieldPath === 'product.formattedSalePrice') {
    const p = context.product;
    return p?.salePrice ? `R ${p.salePrice.toFixed(2)}` : '';
  }
  if (fieldPath === 'product.permalink') {
    const p = context.product;
    return p ? `/product/${p.slug || p._id}` : '#';
  }
  if (fieldPath === 'product.categoryNames') {
    const p = context.product;
    if (!p?.categories) return '';
    return (Array.isArray(p.categories) ? p.categories : [])
      .map(c => (typeof c === 'string' ? c : c.name))
      .filter(Boolean)
      .join(', ');
  }
  if (fieldPath === 'product.featuredImage') {
    const p = context.product;
    if (!p) return '';
    // featuredImage may be a string URL or an object { url, alt }
    if (typeof p.featuredImage === 'string') return p.featuredImage;
    if (p.featuredImage?.url) return p.featuredImage.url;
    // Fallback to mainImage or images[0]
    if (typeof p.mainImage === 'string') return p.mainImage;
    if (p.mainImage?.url) return p.mainImage.url;
    if (Array.isArray(p.images) && p.images.length > 0) {
      const img = p.images[0];
      return typeof img === 'string' ? img : img?.url || '';
    }
    return '';
  }
  if (fieldPath === 'category.permalink') {
    const c = context.category;
    return c ? `/shop?category=${c.slug || c._id}` : '#';
  }
  if (fieldPath === 'category.productCount') {
    return context.category?.productCount ?? context.category?.count ?? 0;
  }
  if (fieldPath === 'category.image') {
    const c = context.category;
    if (!c) return '';
    // Category image is stored as { url, alt } object in the model
    if (typeof c.image === 'string') return c.image;
    if (c.image?.url) return c.image.url;
    return '';
  }

  // Generic path resolution — handles any field path like "product.name", "category.description"
  const parts = fieldPath.replace(/\[(\d+)\]/g, '.$1').split('.');
  let value = context;
  for (const part of parts) {
    if (value == null) return '';
    value = value[part];
  }

  if (value == null) return '';

  // If the resolved value is an object (e.g. nested image), try to extract a useful string
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Common patterns: { url }, { name }, { label }
    return value.url || value.name || value.label || value.title || JSON.stringify(value);
  }

  return value;
}

/**
 * Resolve a string that may contain inline dynamic tokens mixed with static text.
 * E.g. "Buy {{product.name}} now!" → "Buy Nike Air Max now!"
 */
export function resolveInlineTokens(str, context = {}) {
  if (typeof str !== 'string') return str;
  return str.replace(DYNAMIC_TOKEN_INLINE_REGEX, (match) => {
    return resolveDynamicValue(match, context);
  });
}

/**
 * Build context object from a repeater item.
 * Normalizes the raw item into { product: {...}, category: {...} } depending on shape.
 */
export function buildContextFromItem(item, dataSource = 'products') {
  if (!item) return {};
  const ctx = {};
  // Use dataSource as the primary discriminator — field detection as fallback only
  if (dataSource === 'categories') {
    ctx.category = item;
  } else if (dataSource === 'products') {
    ctx.product = item;
    // Also derive a category context from the product's categories so that
    // {{category.name}} works inside a products repeater (shows first category)
    if (Array.isArray(item.categories) && item.categories.length > 0) {
      const firstCat = item.categories[0];
      if (typeof firstCat === 'object' && firstCat !== null) {
        ctx.category = firstCat;
      } else if (typeof firstCat === 'string') {
        ctx.category = { name: firstCat };
      }
    }
  } else if (item.regularPrice !== undefined || item.sku !== undefined) {
    // Field-based detection fallback for unknown dataSource
    ctx.product = item;
  } else if (item.productCount !== undefined || item.slug !== undefined) {
    ctx.category = item;
  } else {
    // Generic — put under product as default
    ctx.product = item;
  }
  return ctx;
}

/**
 * Resolve all dynamic bindings for a node's props.
 * @param {Object} props - The node's props (including dynamicBindings map)
 * @param {Object} context - The dynamic data context
 * @returns {Object} - Merged props with dynamic values resolved
 */
export function resolveDynamicProps(props, context) {
  if (!props || !context) return props;
  const bindings = props.dynamicBindings;
  if (!bindings || typeof bindings !== 'object') return props;

  const resolved = { ...props };
  for (const [propKey, token] of Object.entries(bindings)) {
    if (!token) continue;
    const value = resolveDynamicValue(token, context);
    if (value !== '' && value != null) {
      resolved[propKey] = value;
    }
  }
  return resolved;
}

// ─── Property type hints ───────────────────────────────────────────────────
// Maps common prop names to their dynamic data type for the picker
export const PROP_TYPE_MAP = {
  // Text props
  content: 'text',
  text: 'text',
  title: 'text',
  heading: 'text',
  label: 'text',
  buttonText: 'text',
  addedText: 'text',
  placeholder: 'text',
  alt: 'text',
  caption: 'text',
  description: 'text',
  name: 'text',
  value: 'text',
  price: 'text',
  salePrice: 'text',
  // Image props
  src: 'image',
  mainImage: 'image',
  featuredImage: 'image',
  backgroundImage: 'image',
  image: 'image',
  poster: 'image',
  // URL props
  href: 'url',
  link: 'url',
  url: 'url',
  action: 'url',
  // Number props
  rating: 'number',
  count: 'number',
  quantity: 'number',
  stockQuantity: 'number',
  limit: 'number',
  columns: 'number',
  // Color props
  color: 'color',
  textColor: 'color',
  backgroundColor: 'color',
  borderColor: 'color',
  // Default
  className: 'text',
};

export function getPropType(propName) {
  return PROP_TYPE_MAP[propName] || 'any';
}
