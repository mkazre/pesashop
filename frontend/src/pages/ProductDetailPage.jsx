import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import { useRecentlyViewedStore } from '@/store';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import { VariantSelector, QuantitySelector } from '@/components/product/ProductVariants';
import BuyButtons from '@/components/product/BuyButtons';
import TrustBadges from '@/components/product/TrustBadges';
import ProductTabs from '@/components/product/ProductTabs';
import RelatedProducts from '@/components/product/RelatedProducts';
import Loading from '@/components/common/Loading';
import LaybyWidget from '@/components/product/LaybyWidget';
import LoyaltyPointsBadge from '@/components/loyalty/LoyaltyPointsBadge';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import PageRenderer from '@/components/pagebuilder/PageRenderer';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addProduct } = useRecentlyViewedStore();
  const { components: templateComponents, isLoading: templateLoading, hasTemplate } = usePageTemplate('single-product');
  
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['product', slug],
    () => productsAPI.getOne(slug),
    {
      enabled: !!slug,
      onSuccess: (data) => {
        addProduct(data.data);
      }
    }
  );

  const product = data?.data;

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

  if (isLoading || templateLoading) {
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

  // Fallback: hardcoded product detail layout
  const categoryName = product.categories?.[0]?.name || 'Products';
  const categorySlug = product.categories?.[0]?.slug || 'shop';

  return (
    <div className="bg-white">
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
          {/* Left: Gallery */}
          <ProductGallery images={product.images || []} />

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
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Product Tabs */}
        <ProductTabs product={product} />

        {/* Related Products */}
        <RelatedProducts 
          productId={product._id} 
          categoryId={product.categories?.[0]?._id}
        />
      </div>
    </div>
  );
}
