/**
 * Frontend Dynamic Data Resolver
 * Resolves dynamic tokens like {{product.name}} against context from RepeaterContext.
 */

const DYNAMIC_TOKEN_REGEX = /^\{\{(.+?)\}\}$/;

export function isDynamicValue(value) {
  return typeof value === 'string' && DYNAMIC_TOKEN_REGEX.test(value);
}

export function resolveDynamicValue(token, context = {}) {
  if (!isDynamicValue(token)) return token;
  const fieldPath = token.match(DYNAMIC_TOKEN_REGEX)?.[1];
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
    if (typeof p.featuredImage === 'string') return p.featuredImage;
    if (p.featuredImage?.url) return p.featuredImage.url;
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

  // If the resolved value is an object, try to extract a useful string
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value.url || value.name || value.label || value.title || JSON.stringify(value);
  }

  return value;
}

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
    ctx.product = item;
  } else if (item.productCount !== undefined || item.slug !== undefined) {
    ctx.category = item;
  } else {
    ctx.product = item;
  }
  return ctx;
}

/**
 * Resolve all dynamic bindings for a component's props.
 * @param {Object} props - The component's props (including dynamicBindings map)
 * @param {Object} context - The dynamic data context { product: {...}, category: {...} }
 * @returns {Object} - Props with dynamic values resolved
 */
export function resolveDynamicProps(props, context) {
  if (!props || !context) return props || {};
  const bindings = props.dynamicBindings;
  if (!bindings || typeof bindings !== 'object') return props;

  const resolved = { ...props };
  for (const [propKey, token] of Object.entries(bindings)) {
    if (!token) continue;
    const value = resolveDynamicValue(token, context);
    // Always apply resolved value (including 0, false, empty string)
    // so dynamic bindings override static defaults. Only skip null/undefined.
    if (value != null) {
      resolved[propKey] = value;
    }
  }
  return resolved;
}
