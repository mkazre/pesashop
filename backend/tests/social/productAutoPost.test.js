// Pure logic only — resolveProductPost/resolveMedia/effectiveConfig and the
// publish-transition check operate on plain objects, no DB or HTTP involved.
// The actual end-to-end trigger (real products, real profiles, real
// AutoposterPost/Target creation) was verified live against the real
// database instead, consistent with this repo's testing convention.
const { resolveProductPost, resolveMedia, effectiveConfig } = require('../../services/autoposterProductPostResolver');
const { isPublishedState, wasJustPublished } = require('../../services/autoposterProductAutoPostTrigger');

function baseProduct(overrides = {}) {
  return {
    name: 'Premium Cotton T-Shirt',
    slug: 'premium-cotton-tshirt',
    sku: 'PS-042',
    regularPrice: 299,
    salePrice: undefined,
    shortDescription: 'Soft, breathable, everyday wear.',
    description: '<p>A <b>premium</b> cotton t-shirt.</p>',
    stock: 50,
    lowStockThreshold: 5,
    outOfStock: false,
    rating: 4.6,
    categories: [{ name: 'Apparel' }, { name: 'New Arrivals' }],
    featuredImage: 'https://cdn.example.com/featured.jpg',
    images: ['https://cdn.example.com/featured.jpg', 'https://cdn.example.com/gallery1.jpg', 'https://cdn.example.com/gallery2.jpg'],
    ...overrides
  };
}

function baseProfile(config = {}, perPlatform = {}) {
  return {
    config: {
      images: 'featured_only',
      productName: 'include',
      price: 'show',
      currency: 'ZAR',
      discountInfo: 'show',
      shortDescription: 'include',
      fullDescription: 'exclude',
      categoryTags: 'hashtags',
      stockStatus: 'hide',
      productUrl: 'shortened',
      utmTracking: 'auto_tag',
      ratingReviews: 'hide',
      skuItemCode: 'hide',
      deliveryInfo: 'region_aware',
      ctaPhrase: 'shop_now',
      brandWatermark: 'on',
      ...config
    },
    perPlatform
  };
}

describe('effectiveConfig', () => {
  it('merges per-platform overrides on top of the base config', () => {
    const profile = baseProfile({ price: 'show' }, { linkedin: { price: 'hide' } });
    expect(effectiveConfig(profile, 'linkedin').price).toBe('hide');
    expect(effectiveConfig(profile, 'facebook').price).toBe('show');
  });
});

describe('resolveMedia', () => {
  it('returns only the featured image for featured_only', () => {
    const media = resolveMedia(baseProduct(), { images: 'featured_only' });
    expect(media).toHaveLength(1);
    expect(media[0].url).toBe('https://cdn.example.com/featured.jpg');
  });

  it('includes N gallery images for featured_plus_gallery', () => {
    const media = resolveMedia(baseProduct(), { images: 'featured_plus_gallery', galleryCount: 1 });
    expect(media).toHaveLength(2);
  });

  it('returns nothing for "none"', () => {
    expect(resolveMedia(baseProduct(), { images: 'none' })).toEqual([]);
  });
});

describe('resolveProductPost — profile differences produce visibly different posts', () => {
  it('Default-style profile (price shown) includes the price in the caption', () => {
    const result = resolveProductPost(baseProduct(), baseProfile({ price: 'show' }), 'facebook');
    expect(result.caption).toContain('R299.00');
  });

  it('Premium-style profile (price hidden) omits the price entirely', () => {
    const result = resolveProductPost(baseProduct(), baseProfile({ price: 'hide', fullDescription: 'include' }), 'facebook');
    expect(result.caption).not.toContain('R299.00');
  });

  it('shows a discount line only when a sale price is present and above threshold', () => {
    const onSale = baseProduct({ salePrice: 249 }); // ~17% off
    const withDiscount = resolveProductPost(onSale, baseProfile({ discountInfo: 'show' }), 'facebook');
    expect(withDiscount.caption).toMatch(/% off/);

    const noSale = resolveProductPost(baseProduct(), baseProfile({ discountInfo: 'show' }), 'facebook');
    expect(noSale.caption).not.toMatch(/% off/);
  });

  it('respects show_if_above_threshold for discounts', () => {
    const smallDiscount = baseProduct({ regularPrice: 100, salePrice: 95 }); // 5% off
    const result = resolveProductPost(smallDiscount, baseProfile({ discountInfo: 'show_if_above_threshold', discountThreshold: 10 }), 'facebook');
    expect(result.caption).not.toMatch(/% off/);
  });

  it('abbreviates the product name when productName is "abbreviate"', () => {
    const result = resolveProductPost(baseProduct(), baseProfile({ productName: 'abbreviate', abbreviateLength: 10 }), 'x');
    expect(result.caption).toContain(baseProduct().name.slice(0, 10));
    expect(result.caption).not.toContain(baseProduct().name);
  });

  it('emits hashtags from categories when categoryTags is "hashtags"', () => {
    const result = resolveProductPost(baseProduct(), baseProfile({ categoryTags: 'hashtags' }), 'instagram');
    expect(result.hashtags).toEqual(['Apparel', 'NewArrivals']);
    expect(result.caption).toContain('#Apparel');
  });

  it('shows "Only N left" only when stockStatus is show_if_low and stock is actually low', () => {
    const lowStock = baseProduct({ stock: 3 });
    const result = resolveProductPost(lowStock, baseProfile({ stockStatus: 'show_if_low' }), 'facebook');
    expect(result.caption).toContain('Only 3 left');

    const healthyStock = resolveProductPost(baseProduct({ stock: 40 }), baseProfile({ stockStatus: 'show_if_low' }), 'facebook');
    expect(healthyStock.caption).not.toMatch(/left/);
  });

  it('renders a Handlebars caption template when one is provided, overriding the auto-built caption', () => {
    const template = { content: 'Only at PesaShop: {{product_name}} for {{product_price}}!' };
    const result = resolveProductPost(baseProduct(), baseProfile(), 'facebook', template);
    expect(result.caption).toBe('Only at PesaShop: Premium Cotton T-Shirt for R299.00!');
  });

  it('applies a per-platform override so the same product differs by platform', () => {
    const profile = baseProfile({ price: 'show' }, { linkedin: { price: 'hide', fullDescription: 'include' } });
    const fb = resolveProductPost(baseProduct(), profile, 'facebook');
    const li = resolveProductPost(baseProduct(), profile, 'linkedin');
    expect(fb.caption).toContain('R299.00');
    expect(li.caption).not.toContain('R299.00');
  });
});

describe('publish-transition detection (Spec 9.1)', () => {
  it('isPublishedState is true only when status=active AND isActive=true', () => {
    expect(isPublishedState({ status: 'active', isActive: true })).toBe(true);
    expect(isPublishedState({ status: 'draft', isActive: true })).toBe(false);
    expect(isPublishedState({ status: 'active', isActive: false })).toBe(false);
  });

  it('wasJustPublished is true only on the transition into published', () => {
    expect(wasJustPublished({ status: 'draft', isActive: true }, { status: 'active', isActive: true })).toBe(true);
    expect(wasJustPublished({ status: 'active', isActive: true }, { status: 'active', isActive: true })).toBe(false);
    expect(wasJustPublished(null, { status: 'active', isActive: true })).toBe(true);
    expect(wasJustPublished({ status: 'active', isActive: true }, { status: 'trash', isActive: true })).toBe(false);
  });
});
