import StarRating from '../common/StarRating';
import Badge from '../common/Badge';
import { IoHeart, IoHeartOutline, IoShareSocial } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { useWishlistStore, useAuthStore, useUIStore, useCurrencyStore } from '@/store';
import { useB2BPricing } from '@/hooks/useB2BPricing';
import { useProductDisplay, clampStyle } from '@/hooks/useProductDisplay';
import toast from '@/utils/toast';

export default function ProductInfo({ product, selectedVariation = null, quantity = 1 }) {
  const { t } = useTranslation();
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const isInWishlist = wishlistItems.some(item => item._id === product._id);
  const { displayPrice } = useB2BPricing(product, selectedVariation?._id, quantity);
  const { formatPrice } = useCurrencyStore();
  const { titleLines, shortDescriptionLines } = useProductDisplay('detail');

  const discount = displayPrice.discount || 0;

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      toast.info('Please sign in to add items to your wishlist');
      return;
    }
    if (isInWishlist) {
      removeItem(product._id);
      toast.success(t('toast.removedFromWishlist'));
    } else {
      addItem(product);
      toast.success(t('toast.addedToWishlist'));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('toast.linkCopied'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Badges */}
      <div className="flex items-center gap-2">
        {product.salePrice && <Badge variant="sale">{t('product.sale')}</Badge>}
        {product.isNew && <Badge variant="new">{t('product.newArrival')}</Badge>}
      </div>

      {/* Product Name */}
      <h1 className="text-3xl font-bold text-gray-900" style={clampStyle(titleLines)}>
        {product.name}
      </h1>

      {/* Rating & Reviews */}
      <div className="flex items-center gap-4">
        <StarRating 
          rating={product.rating || 0} 
          count={product.reviewCount || 0} 
          size="lg"
        />
        {product.reviewCount > 0 && (
          <span className="text-sm text-gray-600">
            {t('product.reviewsCount', { count: product.reviewCount })}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-4 py-4 border-y border-gray-200">
        <div className="text-3xl font-bold text-gray-900">
          {formatPrice(displayPrice.displayPrice || product.regularPrice)}
        </div>
        {displayPrice.originalPrice > displayPrice.displayPrice && (
          <>
            <div className="text-xl text-gray-400 line-through">
              {formatPrice(displayPrice.originalPrice)}
            </div>
            {discount > 0 && (
              <Badge variant="sale" className="text-base">
                {t('product.percentOff', { percent: discount })}
              </Badge>
            )}
          </>
        )}
        {displayPrice.isB2B && (
          <Badge variant="new" className="text-base">
            {t('product.b2bPrice')}
          </Badge>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">{t('product.availability')}:</span>
        {product.stock > 0 ? (
          <span className="text-green-600 font-medium">
            {t('product.inStockCount', { count: product.stock })}
          </span>
        ) : (
          <span className="text-red-600 font-medium">{t('product.outOfStock')}</span>
        )}
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-gray-600 leading-relaxed" style={clampStyle(shortDescriptionLines)}>
          {product.shortDescription}
        </p>
      )}

      {/* SKU & Categories */}
      <div className="space-y-2 text-sm">
        {product.sku && (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t('product.sku')}:</span>
            <span className="text-gray-600">{product.sku}</span>
          </div>
        )}
        {product.categories && product.categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">{t('product.categories')}:</span>
            <span className="text-gray-600">
              {product.categories.map(cat => cat.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={handleWishlistToggle}
          className={`flex items-center gap-2 px-6 py-3 border-2 font-medium transition-colors ${
            isInWishlist
              ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
              : 'border-gray-300 hover:border-primary hover:text-primary'
          }`}
        >
          {isInWishlist ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
          {isInWishlist ? t('product.inWishlist') : t('product.addToWishlist')}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-primary hover:text-primary font-medium transition-colors"
        >
          <IoShareSocial size={20} />
          {t('product.share')}
        </button>
      </div>
    </div>
  );
}
