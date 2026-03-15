import { Link } from 'react-router-dom';
import { IoHeartOutline, IoHeart, IoEyeOutline, IoCartOutline } from 'react-icons/io5';
import StarRating from './StarRating';
import Badge from './Badge';
import Button from './Button';
import { useCartStore, useWishlistStore, useUIStore, useCurrencyStore } from '@/store';
import { useB2BPricing } from '@/hooks/useB2BPricing';
import { useProductDisplay, clampStyle } from '@/hooks/useProductDisplay';
import toast from 'react-hot-toast';

export default function ProductCard({ product, layout = 'grid' }) {
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const { openQuickView, openCartSidebar } = useUIStore();
  const { displayPrice } = useB2BPricing(product);
  const { formatPrice } = useCurrencyStore();
  const { titleLines, descriptionLines } = useProductDisplay('other');

  const isInWishlist = wishlistItems.some(item => item._id === product._id);
  const discount = displayPrice.discount || 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success('Added to cart!');
    openCartSidebar();
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (isInWishlist) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    openQuickView(product);
  };

  if (layout === 'list') {
    return (
      <Link 
        to={`/product/${product.slug || product._id}`}
        className="product-card flex gap-4 p-4 group"
      >
        <div className="relative w-48 h-48 flex-shrink-0">
          <img
            src={(() => {
              const imagePath = product.featuredImage || product.images?.[0];
              if (!imagePath) return '/placeholder.jpg';
              if (imagePath.startsWith('http')) return imagePath;
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              return `${apiUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
            })()}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
          {product.salePrice && (
            <Badge variant="sale" className="absolute top-2 left-2">
              SALES
            </Badge>
          )}
          {product.isNew && (
            <Badge variant="new" className="absolute top-2 right-2">
              NEW
            </Badge>
          )}
        </div>
        
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors" style={clampStyle(titleLines)}>
            {product.name}
          </h3>
          <StarRating rating={product.rating || 0} count={product.reviewCount || 0} size="sm" />
          
          <div className="flex items-center gap-3 my-3">
            <span className="price-sale">
              {formatPrice(displayPrice.displayPrice || product.regularPrice)}
            </span>
            {displayPrice.originalPrice > displayPrice.displayPrice && (
              <>
                <span className="price-original">{formatPrice(displayPrice.originalPrice)}</span>
                {discount > 0 && (
                  <span className="price-discount">{discount}% OFF</span>
                )}
              </>
            )}
            {displayPrice.isB2B && (
              <Badge variant="new" className="text-xs">B2B</Badge>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-4" style={clampStyle(descriptionLines || 2)}>
            {product.description}
          </p>

          <div className="flex items-center gap-2 mt-auto">
            <Button
              variant="primary-filled"
              size="sm"
              icon={<IoCartOutline />}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <button
              onClick={handleWishlistToggle}
              className="p-2 border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
            >
              {isInWishlist ? <IoHeart className="text-red-500" /> : <IoHeartOutline />}
            </button>
            <button
              onClick={handleQuickView}
              className="p-2 border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
            >
              <IoEyeOutline />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Grid Layout (Default)
  return (
    <div className="product-card group relative">
      <Link to={`/product/${product.slug || product._id}`} className="block">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-100">
          <img
            src={(() => {
              const imagePath = product.featuredImage || product.images?.[0];
              if (!imagePath) return '/placeholder.jpg';
              if (imagePath.startsWith('http')) return imagePath;
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              return `${apiUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
            })()}
            alt={product.name}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.salePrice && (
              <Badge variant="sale">SALES</Badge>
            )}
            {product.isNew && (
              <Badge variant="new">NEW</Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="out-of-stock">OUT OF STOCK</Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleWishlistToggle}
              className="w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-md"
              title="Add to Wishlist"
            >
              {isInWishlist ? <IoHeart className="text-red-500" size={20} /> : <IoHeartOutline size={20} />}
            </button>
            <button
              onClick={handleQuickView}
              className="w-10 h-10 bg-white hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-md"
              title="Quick View"
            >
              <IoEyeOutline size={20} />
            </button>
          </div>

          {/* Hover: Add to Cart Button */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform">
            <Button
              variant="primary-filled"
              fullWidth
              className="rounded-none"
              icon={<IoCartOutline size={20} />}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-base mb-2 group-hover:text-primary transition-colors min-h-[48px]" style={clampStyle(titleLines || 2)}>
            {product.name}
          </h3>
          
          <StarRating rating={product.rating || 0} count={product.reviewCount || 0} size="sm" />

          <div className="flex items-center gap-2 mt-2">
            <span className="price-sale">
              {formatPrice(displayPrice.displayPrice || product.regularPrice)}
            </span>
            {displayPrice.originalPrice > displayPrice.displayPrice && (
              <>
                <span className="price-original">{formatPrice(displayPrice.originalPrice)}</span>
                {discount > 0 && (
                  <span className="price-discount">{discount}% OFF</span>
                )}
              </>
            )}
            {displayPrice.isB2B && (
              <Badge variant="new" className="text-xs">B2B</Badge>
            )}
          </div>

          {/* Stock Status */}
          {product.stock !== undefined && (
            <div className="mt-2 text-sm">
              {product.stock > 0 ? (
                <span className="text-green-600">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
