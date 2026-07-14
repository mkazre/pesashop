const Handlebars = require('handlebars');

// Resolves a product + AutoposterPostProfile + platform into an actual
// caption and media list (Spec Section 9.5.1's 17 configurable fields).
// If a caption template (Spec 9.3, Handlebars) is supplied, it takes over
// caption generation entirely — the profile's text-related switches (price,
// description, stock, etc.) then only matter insofar as they feed the
// template's variables. Without a template, a straightforward auto-built
// caption is assembled from the same switches directly.

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').trim();
}

function formatMoney(amount, currencyCode) {
  const symbols = { ZAR: 'R', USD: '$', ZWL: 'Z$' };
  return `${symbols[currencyCode] || currencyCode + ' '}${Number(amount).toFixed(2)}`;
}

// Merges the profile's base config with any per-platform override (Spec 9.5.4).
function effectiveConfig(profile, platform) {
  const base = profile.config?.toObject ? profile.config.toObject() : profile.config || {};
  const override = profile.perPlatform?.[platform] || {};
  return { ...base, ...override };
}

function resolvePrice(product, config) {
  if (config.price === 'hide') return '';
  const price = product.salePrice || product.regularPrice;
  if (config.currency === 'multi') {
    // Multi-currency needs the store's live exchange rates (Currency model) —
    // simplified here to ZAR + USD at a placeholder rate, flagged rather than
    // silently wrong. Phase 12/insights work is a natural place to wire in
    // the real currenciesAPI conversion if this needs to be exact.
    return `${formatMoney(price, 'ZAR')} / ${formatMoney(price * 0.055, 'USD')} (approx.)`;
  }
  return formatMoney(price, config.currency || 'ZAR');
}

function resolveDiscount(product, config) {
  if (!product.salePrice || !product.regularPrice || product.salePrice >= product.regularPrice) return '';
  const pct = Math.round((1 - product.salePrice / product.regularPrice) * 100);
  if (config.discountInfo === 'hide') return '';
  if (config.discountInfo === 'show_if_above_threshold' && pct < (config.discountThreshold ?? 10)) return '';
  return `${pct}% off`;
}

function resolveStockStatus(product, config) {
  if (config.stockStatus === 'hide') return '';
  const isLow = !product.outOfStock && product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5);
  if (config.stockStatus === 'show_if_low') return isLow ? `Only ${product.stock} left` : '';
  if (product.outOfStock) return 'Out of Stock';
  return isLow ? `Only ${product.stock} left` : 'In Stock';
}

function resolveProductUrl(product, config) {
  const fullUrl = `${process.env.FRONTEND_URL || 'https://pesashop.com'}/product/${product.slug}`;
  if (config.productUrl === 'hide') return '';
  if (config.productUrl === 'link_in_bio') return 'Link in bio';
  // 'shortened' would use a real URL shortener — none is integrated yet, so
  // this falls back to the full URL rather than faking a short one.
  return fullUrl;
}

function appendUtm(url, config, platform) {
  if (config.utmTracking !== 'auto_tag' || !url || url === 'Link in bio') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=${platform}&utm_medium=social&utm_campaign=product_auto`;
}

const CTA_TEXT = {
  shop_now: 'Shop now',
  order_today: 'Order today',
  send_to_family: 'Send to family',
  link_in_bio: 'Link in bio',
  none: ''
};

function resolveCta(config) {
  if (config.ctaPhrase === 'custom') return config.customCtaText || '';
  return CTA_TEXT[config.ctaPhrase] ?? CTA_TEXT.shop_now;
}

function resolveCategoryNames(product) {
  return (product.categories || []).map((c) => c.name || c).filter(Boolean);
}

// Builds the Handlebars variable set (Spec 9.3) from a product + resolved config.
function buildTemplateContext(product, config, platform) {
  const categoryNames = resolveCategoryNames(product);
  const hashtags = categoryNames.map((n) => n.replace(/\s+/g, ''));
  return {
    product_name: config.productName === 'exclude' ? '' : config.productName === 'abbreviate' ? product.name.slice(0, config.abbreviateLength ?? 40) : product.name,
    product_price: resolvePrice(product, config),
    product_short_desc: config.shortDescription === 'exclude' ? '' : config.shortDescription === 'truncate' ? (product.shortDescription || '').slice(0, config.truncateLength ?? 160) : (product.shortDescription || ''),
    product_url: appendUtm(resolveProductUrl(product, config), config, platform),
    product_category: categoryNames.join(', '),
    store_name: 'PesaShop',
    currency: config.currency === 'multi' ? 'ZAR/USD' : (config.currency || 'ZAR'),
    hashtags: hashtags.map((h) => `#${h}`).join(' '),
    discount_percent: resolveDiscount(product, config),
    stock_status: resolveStockStatus(product, config)
  };
}

// Resolves the effective media list for the post (Spec 9.5.1's images/video
// switches). Post-level, not per-target — AutoposterPost.mediaRefs is shared
// across all platform targets, matching the data model (Spec 4.2), so this
// uses the base profile config only, not per-platform image-count overrides.
function resolveMedia(product, config) {
  const media = [];
  const gallery = (product.images || []).filter((url) => url !== product.featuredImage);

  if (config.images === 'featured_only' && product.featuredImage) {
    media.push({ type: 'image', url: product.featuredImage, alt: product.name });
  } else if (config.images === 'featured_plus_gallery') {
    if (product.featuredImage) media.push({ type: 'image', url: product.featuredImage, alt: product.name });
    gallery.slice(0, config.galleryCount ?? 0).forEach((url) => media.push({ type: 'image', url, alt: product.name }));
  } else if (config.images === 'all_gallery') {
    (product.images || []).forEach((url) => media.push({ type: 'image', url, alt: product.name }));
  }
  // 'none' -> no media

  return media;
}

// Full resolution: given a product, profile, platform, and optional caption
// template, returns { caption, hashtags, media } ready to become an
// AutoposterPostTarget (caption/hashtags) plus the shared AutoposterPost's
// mediaRefs.
function resolveProductPost(product, profile, platform, template) {
  const config = effectiveConfig(profile, platform);
  const context = buildTemplateContext(product, config, platform);

  let caption;
  if (template?.content) {
    caption = Handlebars.compile(template.content)(context);
  } else {
    const rating = config.ratingReviews !== 'hide' && product.rating && (config.ratingReviews === 'show' || product.rating >= (config.ratingThreshold ?? 4))
      ? `★ ${product.rating.toFixed(1)}`
      : '';
    const fullDescription = config.fullDescription === 'include' ? stripHtml(product.description) : '';
    const sku = config.skuItemCode === 'show' ? `SKU: ${product.sku}` : '';
    const delivery = config.deliveryInfo === 'hide' ? '' : config.deliveryInfo === 'region_aware' ? 'Delivery to Zimbabwe, or same-day in Harare' : 'Delivery available';
    const categoryText = config.categoryTags === 'text' ? context.product_category : '';

    caption = [
      context.product_name,
      context.product_price,
      context.discount_percent,
      context.product_short_desc,
      fullDescription,
      categoryText,
      context.stock_status,
      rating,
      sku,
      delivery,
      resolveCta(config),
      context.product_url,
      config.categoryTags === 'hashtags' ? context.hashtags : ''
    ].filter(Boolean).join('\n');
  }

  return {
    caption,
    hashtags: config.categoryTags === 'hashtags' ? resolveCategoryNames(product).map((n) => n.replace(/\s+/g, '')) : [],
    media: resolveMedia(product, config)
  };
}

module.exports = { resolveProductPost, effectiveConfig, buildTemplateContext, resolveMedia };
