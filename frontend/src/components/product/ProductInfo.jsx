import StarRating from '../common/StarRating';
import Badge from '../common/Badge';
import { IoHeart, IoHeartOutline, IoShareSocialOutline } from 'react-icons/io5';
import { useWishlistStore } from '@/store';
import { useB2BPricing } from '@/hooks/useB2BPricing';
import { useProductDisplay, clampStyle } from '@/hooks/useProductDisplay';
import toast from 'react-hot-toast';

export default function ProductInfo({ product, selectedVariation = null, quantity = 1 }) {
  const { items: wishlistItems, addItem, removeItem } = useWishlistStore();
  const isInWishlist = wishlistItems.some(item => item._id === product._id);
  const { displayPrice } = useB2BPricing(product, selectedVariation?._id, quantity);
  const { titleLines, shortDescriptionLines } = useProductDisplay('detail');

  const discount = displayPrice.discount || 0;

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeItem(product._id);
      toast.success('Removed from wishlist');
    } else {
      addItem(product);
      toast.success('Added to wishlist!');
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
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Badges */}
      <div className="flex items-center gap-2">
        {product.salePrice && <Badge variant="sale">SALES</Badge>}
        {product.isNew && <Badge variant="new">NEW ARRIVAL</Badge>}
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
            ({product.reviewCount} Reviews)
          </span>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-4 py-4 border-y border-gray-200">
        <div className="text-3xl font-bold text-gray-900">
          R{displayPrice.displayPrice?.toFixed(2) || product.regularPrice}
        </div>
        {displayPrice.originalPrice > displayPrice.displayPrice && (
          <>
            <div className="text-xl text-gray-400 line-through">
              R{displayPrice.originalPrice?.toFixed(2)}
            </div>
            {discount > 0 && (
              <Badge variant="sale" className="text-base">
                {discount}% OFF
              </Badge>
            )}
          </>
        )}
        {displayPrice.isB2B && (
          <Badge variant="new" className="text-base">
            B2B Price
          </Badge>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">Availability:</span>
        {product.stock > 0 ? (
          <span className="text-green-600 font-medium">
            In Stock ({product.stock} available)
          </span>
        ) : (
          <span className="text-red-600 font-medium">Out of Stock</span>
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
            <span className="text-gray-700 font-medium">SKU:</span>
            <span className="text-gray-600">{product.sku}</span>
          </div>
        )}
        {product.categories && product.categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">Categories:</span>
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
          {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-primary hover:text-primary font-medium transition-colors"
        >
          <IoShareSocialOutline size={20} />
          Share
        </button>
      </div>
    </div>
  );
}
