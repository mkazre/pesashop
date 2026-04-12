import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import { useRecentlyViewedStore } from '@/store';
import { useAnalytics } from '@/hooks/useAnalytics';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import { VariantSelector, QuantitySelector } from '@/components/product/ProductVariants';
import BuyButtons from '@/components/product/BuyButtons';
import TrustBadges from '@/components/product/TrustBadges';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProducts from '@/components/product/RelatedProducts';
import CustomersAlsoBought from '@/components/product/CustomersAlsoBought';
import RecommendedWithPurchase from '@/components/product/RecommendedWithPurchase';
import Loading from '@/components/common/Loading';
import LaybyWidget from '@/components/product/LaybyWidget';
import RecurringWidget from '@/components/product/RecurringWidget';
import OfferSlot from '@/components/offers/OfferSlot';
import ServiceProviderAdSlot from '@/components/ads/ServiceProviderAdSlot';
import LoyaltyPointsBadge from '@/components/loyalty/LoyaltyPointsBadge';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import PageRenderer from '@/components/pagebuilder/PageRenderer';
import WalmartProductPage from '@/components/product/WalmartProductPage';
import useProductPageSettings from '@/hooks/useProductPageSettings';
import { useSingleProductBadges } from '@/hooks/useProductBadges';
import StickyAddToCart from '@/components/product/StickyAddToCart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BADGE_POS = {
  'top-left': { top: 0, left: 0 },
  'top-center': { top: 0, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 0, right: 0 },
  'middle-left': { top: '50%', left: 0, transform: 'translateY(-50%)' },
  'middle-center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'middle-right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
  'bottom-left': { bottom: 0, left: 0 },
  'bottom-center': { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 0, right: 0 },
};

function ProductPageBadge({ badge }) {
  const s = badge.style || {};
  const pos = s.position || 'top-left';
  const posStyle = pos === 'custom'
    ? { top: s.customTop || undefined, right: s.customRight || undefined, bottom: s.customBottom || undefined, left: s.customLeft || undefined }
    : (BADGE_POS[pos] || BADGE_POS['top-left']);
  const bg = s.useGradient
    ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})`
    : (s.backgroundColor || '#ef4444');
  const style = {
    position: 'absolute', ...posStyle, zIndex: s.zIndex || 10,
    color: s.textColor || '#fff', background: bg,
    fontSize: s.fontSize || '12px', fontWeight: s.fontWeight || '700',
    textTransform: s.textTransform || 'uppercase', letterSpacing: s.letterSpacing || '0.5px',
    lineHeight: s.lineHeight || '1',
    padding: `${s.paddingTop || '6px'} ${s.paddingRight || '12px'} ${s.paddingBottom || '6px'} ${s.paddingLeft || '12px'}`,
    margin: `${s.marginTop || '12px'} ${s.marginRight || '12px'} ${s.marginBottom || '0'} ${s.marginLeft || '12px'}`,
    borderRadius: s.borderRadius || '4px', opacity: s.opacity || '1',
  };
  if (s.badgeType === 'image' && s.imageUrl) {
    const imgUrl = s.imageUrl.startsWith('http') ? s.imageUrl : `${API_URL}${s.imageUrl}`;
    return <div style={{ ...style, background: 'transparent', padding: 0 }}><img src={imgUrl} alt={badge.name} style={{ width: s.imageWidth || '80px', height: 'auto' }} /></div>;
  }
  return <div style={style}>{s.text || badge.name}</div>;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addProduct } = useRecentlyViewedStore();
  const { trackProductView } = useAnalytics();
  const trackedRef = useRef(null);
  const { components: templateComponents, isLoading: templateLoading, hasTemplate } = usePageTemplate('single-product');
  const { settings: pageSettings, isLoading: settingsLoading } = useProductPageSettings();
  
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['product', slug],
    () => productsAPI.getOne(slug),
    {
      enabled: !!slug,
      onSuccess: (data) => {
        addProduct(data.data?.data || data.data);
      }
    }
  );

  const product = data?.data?.data || data?.data;

  // Fetch evaluated badges for this product
  const { data: productBadgesRaw = [] } = useSingleProductBadges(product?._id, !!product?._id);
  const productBadges = Array.isArray(productBadgesRaw) ? productBadgesRaw : [];
  const pageBadges = productBadges.filter(b => b.displayOn?.productPages !== false);

  // Track product view for stats
  useEffect(() => {
    if (product?._id && trackedRef.current !== product._id) {
      trackedRef.current = product._id;
      trackProductView(product._id, product.name);
    }
  }, [product?._id, product?.name, trackProductView]);

  // Extract unique sizes and colors from variants
  const sizes = product?.variants?.map(v => v.size).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) || [];
  const colors = product?.variants?.map(v => v.color).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) || [];

  // Auto-select first variant if available
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [sizes, colors]);

  if (isLoading || templateLoading || settingsLoading) {
    return <Loading fullScreen text="Loading product..." />;
  }

  if (error || !product) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <p className="text-gray-600">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  // If a published single-product template exists, render it with product context
  if (hasTemplate && templateComponents) {
    return (
      <div className="bg-white">
        <PageRenderer components={templateComponents} product={product} />
      </div>
    );
  }

  // If ProductPageSettings exist and layout is 3-col-walmart, use WalmartProductPage
  if (pageSettings && pageSettings.layout?.type === '3-col-walmart') {
    return <WalmartProductPage product={product} settings={pageSettings} />;
  }

  // Fallback: standard 2-column product detail layout
  const categoryName = product.categories?.[0]?.name || 'Products';
  const categorySlug = product.categories?.[0]?.slug || 'shop';

  return (
    <div className="bg-white">
      <StickyAddToCart
        product={product}
        quantity={quantity}
        selectedVariant={{ size: selectedSize, color: selectedColor }}
        disabled={(sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor)}
      />
      <div className="container-custom py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: categoryName, href: `/shop/${categorySlug}` },
            { label: product.name }
          ]} 
        />

        {/* Product Main Section */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 py-8">
          {/* Left: Gallery + Badges */}
          <div className="relative">
            <ProductGallery images={product.images || []} />
            {pageBadges.map(badge => (
              <ProductPageBadge key={badge._id} badge={badge} />
            ))}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="space-y-6">
            <ProductInfo product={product} />

            <div className="border-t border-gray-200 pt-6 space-y-4">
              {/* Color Selector */}
              {colors.length > 0 && (
                <VariantSelector
                  variants={colors}
                  selectedVariant={selectedColor}
                  onSelect={setSelectedColor}
                  type="color"
                />
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <VariantSelector
                  variants={sizes}
                  selectedVariant={selectedSize}
                  onSelect={setSelectedSize}
                  type="size"
                />
              )}

              {/* Quantity */}
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                stock={product.stock}
              />

              {/* Buy Buttons */}
              <BuyButtons
                product={product}
                quantity={quantity}
                selectedVariant={{
                  size: selectedSize,
                  color: selectedColor
                }}
                disabled={
                  (sizes.length > 0 && !selectedSize) ||
                  (colors.length > 0 && !selectedColor)
                }
              />

              {/* PESA Coins Badge */}
              <LoyaltyPointsBadge productId={product._id} quantity={quantity} />

              {/* Layby Widget */}
              <LaybyWidget product={product} />

              {/* Recurring Purchase Widget */}
              <RecurringWidget product={product} />
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Service Provider Ads — below buy buttons */}
        <ServiceProviderAdSlot
          slotId="product_detail_below_buy"
          pageType="product"
          productId={product._id}
          categorySlug={product.categories?.[0]?.slug}
          className="mt-4"
        />

        {/* Product Tabs */}
        <ProductTabs product={product} />

        {/* Related Products */}
        <RelatedProducts 
          productId={product._id} 
          categoryId={product.categories?.[0]?._id}
        />

        {/* Customers Also Bought */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customers Also Bought</h2>
          <CustomersAlsoBought productId={product._id} />
        </div>

        {/* Recommended With Your Purchase */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recommended With Your Purchase</h2>
          <RecommendedWithPurchase productId={product._id} />
        </div>

        {/* Special Offers */}
        <OfferSlot page="product_detail" className="mt-6 mb-8" />
      </div>
    </div>
  );
}
