import { Link } from 'react-router-dom';
import {
  IoHeartOutline,
  IoHeart,
  IoEye,
  IoCart,
  IoGitCompare,
  IoTime,
  IoLocation,
} from 'react-icons/io5';
import StarRating from '../common/StarRating';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useCartStore, useWishlistStore, useCompareStore, useAuthStore, useUIStore, useCurrencyStore } from '@/store';
import { useB2BPricing } from '@/hooks/useB2BPricing';
import { useLaybyEligibility } from '@/hooks/useLaybyEligibility';
import toast from '@/utils/toast';
import { useCartSuccessOverlay } from '@/components/common/CartSuccessOverlay';
import { loyaltyAPI } from '@/services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(path) {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

function clampStyle(lines) {
  if (!lines || lines <= 0) return {};
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

const ASPECT_RATIOS = {
  'square': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video',
  'auto': '',
};

const SHADOW_MAP = {
  'none': 'shadow-none',
  'sm': 'shadow-sm',
  'md': 'shadow-md',
  'lg': 'shadow-lg',
  'xl': 'shadow-xl',
};

// ── Position mapping for custom badges ────────────────────────────
const BADGE_POSITION_STYLES = {
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

const ANIMATION_MAP = {
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  // others handled via inline keyframes if needed
};

function CustomBadge({ badge }) {
  const s = badge.style || {};
  const pos = s.position || 'top-right';
  const posStyle = pos === 'custom'
    ? { top: s.customTop || undefined, right: s.customRight || undefined, bottom: s.customBottom || undefined, left: s.customLeft || undefined }
    : (BADGE_POSITION_STYLES[pos] || BADGE_POSITION_STYLES['top-right']);

  const bg = s.useGradient
    ? `linear-gradient(${s.gradientDirection || '135deg'}, ${s.gradientFrom || '#ef4444'}, ${s.gradientTo || '#f97316'})`
    : (s.backgroundColor || '#ef4444');

  const baseStyle = {
    position: 'absolute',
    ...posStyle,
    zIndex: s.zIndex || 10,
    color: s.textColor || '#fff',
    background: bg,
    fontSize: s.fontSize || '12px',
    fontWeight: s.fontWeight || '700',
    fontFamily: s.fontFamily || undefined,
    fontStyle: s.fontStyle || undefined,
    textTransform: s.textTransform || 'uppercase',
    letterSpacing: s.letterSpacing || '0.5px',
    lineHeight: s.lineHeight || '1',
    paddingTop: s.paddingTop || '4px',
    paddingRight: s.paddingRight || '10px',
    paddingBottom: s.paddingBottom || '4px',
    paddingLeft: s.paddingLeft || '10px',
    marginTop: s.marginTop || '8px',
    marginRight: s.marginRight || '8px',
    marginBottom: s.marginBottom || '0px',
    marginLeft: s.marginLeft || '0px',
    borderRadius: s.borderRadius || '4px',
    borderWidth: s.borderWidth || '0px',
    borderStyle: s.borderStyle || 'solid',
    borderColor: s.borderColor || 'transparent',
    boxShadow: s.boxShadow || undefined,
    opacity: s.opacity || '1',
    width: s.width !== 'auto' ? s.width : undefined,
    height: s.height !== 'auto' ? s.height : undefined,
    minWidth: s.minWidth || undefined,
    maxWidth: s.maxWidth || undefined,
    transform: [
      posStyle.transform || '',
      s.rotate && s.rotate !== '0deg' ? `rotate(${s.rotate})` : '',
      s.scale && s.scale !== '1' ? `scale(${s.scale})` : '',
      s.translateX && s.translateX !== '0px' ? `translateX(${s.translateX})` : '',
      s.translateY && s.translateY !== '0px' ? `translateY(${s.translateY})` : '',
    ].filter(Boolean).join(' ') || undefined,
  };

  // Individual border radii override
  if (s.borderTopLeftRadius) baseStyle.borderTopLeftRadius = s.borderTopLeftRadius;
  if (s.borderTopRightRadius) baseStyle.borderTopRightRadius = s.borderTopRightRadius;
  if (s.borderBottomRightRadius) baseStyle.borderBottomRightRadius = s.borderBottomRightRadius;
  if (s.borderBottomLeftRadius) baseStyle.borderBottomLeftRadius = s.borderBottomLeftRadius;

  const animClass = ANIMATION_MAP[s.animation] || '';

  if (s.badgeType === 'image' && s.imageUrl) {
    const imgUrl = s.imageUrl.startsWith('http') ? s.imageUrl : `${API_URL}${s.imageUrl}`;
    return (
      <div style={{ ...baseStyle, background: 'transparent', padding: 0 }} className={animClass}>
        <img src={imgUrl} alt={badge.name} style={{ width: s.imageWidth || '60px', height: s.imageHeight || 'auto', objectFit: s.imageObjectFit || 'contain' }} />
      </div>
    );
  }

  if (s.badgeType === 'html' && s.htmlContent) {
    return <div style={baseStyle} className={animClass} dangerouslySetInnerHTML={{ __html: s.htmlContent }} />;
  }

  return <div style={baseStyle} className={animClass}>{s.text || badge.name}</div>;
}

export default function ArchiveProductCard({ product, layout = 'grid', settings = {}, evaluatedBadges = [] }) {
  const pc = settings?.productCard || {};
  const pg = settings?.productGrid || {};
  const theme = settings?.theme || {};
  const compare = settings?.compare || {};

  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const { items: compareItems, addItem: addToCompare, removeItem: removeFromCompare } = useCompareStore();
  const { isAuthenticated } = useAuthStore();
  const { openQuickView, openCartSidebar, openAuthModal } = useUIStore();
  const { displayPrice } = useB2BPricing(product);
  const { formatPrice } = useCurrencyStore();

  const isInWishlist = wishlistItems.some(item => item._id === product._id);
  const isInCompare = compareItems.some(item => item._id === product._id);
  const discount = displayPrice.discount || 0;
  const showOverlay = useCartSuccessOverlay((s) => s.show);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    showOverlay({ product, points: 0, cashValue: 0, coinLabel: 'PESA Coins' });
    try {
      const res = await loyaltyAPI.calculateProductPoints(product._id, 1);
      const pts = res.data?.data?.points || 0;
      const cash = res.data?.data?.cashValueZAR || 0;
      if (pts > 0) showOverlay({ product, points: pts, cashValue: cash, coinLabel: 'PESA Coins' });
    } catch { /* overlay already showing */ }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      toast.info('Please sign in to add items to your wishlist');
      return;
    }
    if (isInWishlist) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCompare) {
      removeFromCompare(product._id);
      toast.success('Removed from compare');
    } else {
      addToCompare(product);
      toast.success('Added to compare!');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  // Determine category name
  const categoryName = product.category?.name || '';
  const laybyEligible = useLaybyEligibility(product?._id);
  const hasLayby = laybyEligible === true;
  const inStock = product.stock === undefined || product.stock > 0;
  const isLowStock = product.stock !== undefined && product.stock > 0 && product.stock <= (pc.lowStockThreshold || 5);

  // Card styling from theme
  const cardStyle = {
    background: theme.cardBackground || '#ffffff',
    borderColor: theme.cardBorderColor || '#e5e7eb',
    borderRadius: (theme.cardBorderRadius ?? 8) + 'px',
  };

  const aspectClass = ASPECT_RATIOS[pg.imageAspectRatio] || ASPECT_RATIOS.square;
  const shadowClass = SHADOW_MAP[theme.cardShadow] || 'shadow-sm';
  const hoverShadowClass = SHADOW_MAP[theme.hoverShadow] || 'shadow-lg';

  // ════════════════════════════════════════════════════════════════════════════
  // LIST LAYOUT
  // ════════════════════════════════════════════════════════════════════════════
  if (layout === 'list') {
    return (
      <div
        className={`group relative border ${shadowClass} hover:${hoverShadowClass} transition-all duration-300`}
        style={cardStyle}
      >
        <Link to={`/product/${product.slug || product._id}`} className="flex gap-4 p-4">
          {/* Image */}
          <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden" style={{ borderRadius: (theme.cardBorderRadius ?? 8) + 'px' }}>
            <img
              src={getImageSrc(product.featuredImage || product.images?.[0])}
              alt={product.name}
              className={`w-full h-full transition-transform duration-300 ${pg.hoverEffect === 'zoom' ? 'group-hover:scale-110' : ''}`}
              style={{ objectFit: pg.imageObjectFit || 'cover' }}
              onError={(e) => { e.target.src = '/placeholder.jpg'; }}
            />
            {/* Badges */}
            {pc.showBadges !== false && (
              <div className={`absolute ${pc.badgePosition === 'top-right' ? 'top-2 right-2' : 'top-2 left-2'} flex flex-col gap-1`}>
                {pc.showSaleBadge !== false && product.salePrice && <Badge variant="sale">SALE</Badge>}
                {pc.showNewBadge !== false && product.isNew && <Badge variant="new">NEW</Badge>}
                {pc.showOutOfStockBadge !== false && !inStock && <Badge variant="out-of-stock">OUT OF STOCK</Badge>}
              </div>
            )}
            {/* Custom evaluated badges */}
            {evaluatedBadges.filter(b => b.displayOn?.productCards !== false).map(badge => (
              <CustomBadge key={badge._id} badge={badge} />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Category */}
            {pc.showCategory !== false && categoryName && (
              <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">{categoryName}</span>
            )}

            {/* Title */}
            {pc.showTitle !== false && (
              <h3
                className="font-medium mb-1 group-hover:text-primary transition-colors"
                style={{
                  fontSize: (pc.titleFontSize || 14) + 'px',
                  fontWeight: pc.titleFontWeight || '500',
                  ...clampStyle(pc.titleLines || 2),
                }}
              >
                {product.name}
              </h3>
            )}

            {/* Rating */}
            {pc.showRating !== false && (
              <div className="mb-1">
                <StarRating rating={product.rating || 0} count={pc.showReviewCount !== false ? (product.reviewCount || 0) : undefined} size={pc.ratingSize || 'sm'} />
              </div>
            )}

            {/* Description */}
            {pc.showDescription !== false && product.description && (
              <p className="text-gray-600 text-sm mb-2" style={clampStyle(pc.descriptionLines || 2)}>
                {product.description}
              </p>
            )}

            {/* Price */}
            {pc.showPrice !== false && (
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold" style={{ fontSize: (pc.priceFontSize || 16) + 'px', color: pc.salePriceColor || '#dc2626' }}>
                  {formatPrice(displayPrice.displayPrice || product.regularPrice)}
                </span>
                {pc.showOriginalPrice !== false && displayPrice.originalPrice > displayPrice.displayPrice && (
                  <span className="text-gray-400 line-through text-sm">{formatPrice(displayPrice.originalPrice)}</span>
                )}
                {pc.showDiscountBadge !== false && discount > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">{discount}% OFF</span>
                )}
              </div>
            )}

            {/* Layby Indicator */}
            {pc.showLaybyIndicator !== false && hasLayby && (
              <div className="flex items-center gap-1 text-xs mb-1" style={{ color: pc.laybyIndicatorColor || '#f59e0b' }}>
                <IoTime size={12} />
                <span className="font-medium">{pc.laybyIndicatorText || 'Layby Available'}</span>
              </div>
            )}

            {/* Delivery Estimate */}
            {pc.showDeliveryEstimate !== false && inStock && (
              <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                <IoLocation size={12} />
                <span>{(pc.deliveryEstimateText || 'Delivers in {days}').replace('{days}', pc.defaultDeliveryDays || '2-5 days')}</span>
              </div>
            )}

            {/* Stock */}
            {pc.showStock !== false && (
              <div className="text-xs mb-2">
                {inStock ? (
                  <span className={isLowStock ? 'text-amber-600 font-medium' : 'text-green-600'}>
                    {isLowStock ? `Only ${product.stock} left!` : 'In Stock'}
                    {pc.showStockCount && product.stock !== undefined && !isLowStock ? ` (${product.stock})` : ''}
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto">
              {pc.showAddToCart !== false && inStock && (
                <Button variant="primary-filled" size="sm" icon={<IoCart />} onClick={handleAddToCart}>
                  {pc.addToCartText || 'Add to Cart'}
                </Button>
              )}
              {pc.showWishlistButton !== false && (
                <button onClick={handleWishlistToggle} className="p-2 border border-gray-300 hover:border-primary hover:text-primary transition-colors rounded" title="Wishlist">
                  {isInWishlist ? <IoHeart className="text-red-500" size={16} /> : <IoHeartOutline size={16} />}
                </button>
              )}
              {compare.enabled !== false && pc.showCompareButton !== false && (
                <button onClick={handleCompareToggle} className={`p-2 border border-gray-300 hover:border-primary transition-colors rounded ${isInCompare ? 'bg-primary text-white border-primary' : 'hover:text-primary'}`} title="Compare">
                  <IoGitCompare size={16} />
                </button>
              )}
              {pc.showQuickView !== false && (
                <button onClick={handleQuickView} className="p-2 border border-gray-300 hover:border-primary hover:text-primary transition-colors rounded" title="Quick View">
                  <IoEye size={16} />
                </button>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GRID LAYOUT (DEFAULT)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`group relative border ${shadowClass} hover:${hoverShadowClass} transition-all duration-300 overflow-hidden`}
      style={cardStyle}
    >
      <Link to={`/product/${product.slug || product._id}`} className="block">
        {/* Image Container */}
        <div className={`relative overflow-hidden bg-gray-100 ${aspectClass}`}>
          <img
            src={getImageSrc(product.featuredImage || product.images?.[0])}
            alt={product.name}
            className={`w-full h-full transition-transform duration-300 ${pg.hoverEffect === 'zoom' ? 'group-hover:scale-110' : ''}`}
            style={{ objectFit: pg.imageObjectFit || 'cover' }}
            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
          />

          {/* Hover second image (swap) */}
          {pg.hoverEffect === 'swap-image' && product.images?.length > 1 && (
            <img
              src={getImageSrc(product.images[pg.hoverImageIndex || 1])}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Badges */}
          {pc.showBadges !== false && (
            <div className={`absolute ${pc.badgePosition === 'top-right' ? 'top-2 right-2' : pc.badgePosition === 'bottom-left' ? 'bottom-2 left-2' : pc.badgePosition === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 left-2'} flex flex-col gap-1 z-10`}>
              {pc.showSaleBadge !== false && product.salePrice && <Badge variant="sale">SALE</Badge>}
              {pc.showNewBadge !== false && product.isNew && <Badge variant="new">NEW</Badge>}
              {pc.showOutOfStockBadge !== false && !inStock && <Badge variant="out-of-stock">OUT OF STOCK</Badge>}
              {pc.showDiscountBadge !== false && discount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{discount}%</span>
              )}
            </div>
          )}
          {/* Custom evaluated badges */}
          {evaluatedBadges.filter(b => b.displayOn?.productCards !== false).map(badge => (
            <CustomBadge key={badge._id} badge={badge} />
          ))}

          {/* Layby badge on image */}
          {pc.showLaybyIndicator !== false && hasLayby && (
            <div
              className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded z-10"
              style={{ backgroundColor: pc.laybyIndicatorColor || '#f59e0b', color: '#fff' }}
            >
              {pc.laybyIndicatorText || 'Layby Available'}
            </div>
          )}

          {/* Quick Actions — overlay right */}
          {(pc.quickActionsPosition || 'overlay-right') === 'overlay-right' && (
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              {pc.showWishlistButton !== false && (
                <button onClick={handleWishlistToggle} className="w-8 h-8 bg-white hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-md rounded" title="Wishlist">
                  {isInWishlist ? <IoHeart className="text-red-500" size={16} /> : <IoHeartOutline size={16} />}
                </button>
              )}
              {pc.showQuickView !== false && (
                <button onClick={handleQuickView} className="w-8 h-8 bg-white hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-md rounded" title="Quick View">
                  <IoEye size={16} />
                </button>
              )}
              {compare.enabled !== false && pc.showCompareButton !== false && (
                <button onClick={handleCompareToggle} className={`w-8 h-8 flex items-center justify-center transition-colors shadow-md rounded ${isInCompare ? 'bg-primary text-white' : 'bg-white hover:bg-primary hover:text-white'}`} title="Compare">
                  <IoGitCompare size={16} />
                </button>
              )}
            </div>
          )}

          {/* Add to Cart — hover bar at bottom */}
          {pc.showAddToCart !== false && inStock && (pc.addToCartStyle || 'hover-bar') === 'hover-bar' && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-10">
              <button
                onClick={handleAddToCart}
                className="w-full py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                style={{ backgroundColor: theme.primaryColor || '#1b5e35' }}
              >
                <IoCart size={14} />
                {pc.addToCartText || 'Add to Cart'}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Category */}
          {pc.showCategory !== false && categoryName && (
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{categoryName}</span>
          )}

          {/* Title */}
          {pc.showTitle !== false && (
            <h3
              className="group-hover:text-primary transition-colors mt-1 leading-snug"
              style={{
                fontSize: (pc.titleFontSize || 14) + 'px',
                fontWeight: pc.titleFontWeight || '500',
                ...clampStyle(pc.titleLines || 2),
                minHeight: ((pc.titleFontSize || 14) * 1.4 * (pc.titleLines || 2)) + 'px',
              }}
            >
              {product.name}
            </h3>
          )}

          {/* Rating */}
          {pc.showRating !== false && (
            <div className="mt-1">
              <StarRating rating={product.rating || 0} count={pc.showReviewCount !== false ? (product.reviewCount || 0) : undefined} size={pc.ratingSize || 'sm'} />
            </div>
          )}

          {/* Brand */}
          {pc.showBrand && product.brand && (
            <div className="text-[11px] text-gray-500 mt-0.5">by {product.brand}</div>
          )}

          {/* Price */}
          {pc.showPrice !== false && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="font-bold" style={{ fontSize: (pc.priceFontSize || 16) + 'px', color: pc.salePriceColor || '#dc2626' }}>
                {formatPrice(displayPrice.displayPrice || product.regularPrice)}
              </span>
              {pc.showOriginalPrice !== false && displayPrice.originalPrice > displayPrice.displayPrice && (
                <span className="text-gray-400 line-through text-xs">{formatPrice(displayPrice.originalPrice)}</span>
              )}
            </div>
          )}

          {/* Stock */}
          {pc.showStock !== false && (
            <div className="text-[11px] mt-1">
              {inStock ? (
                <span className={isLowStock ? 'text-amber-600 font-medium' : 'text-green-600'}>
                  {isLowStock ? `Only ${product.stock} left!` : 'In Stock'}
                  {pc.showStockCount && product.stock !== undefined && !isLowStock ? ` (${product.stock})` : ''}
                </span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
          )}

          {/* Delivery Estimate */}
          {pc.showDeliveryEstimate !== false && inStock && (
            <div className="flex items-center gap-1 text-[11px] text-green-600 mt-1">
              <IoLocation size={10} />
              <span>{(pc.deliveryEstimateText || 'Delivers in {days}').replace('{days}', pc.defaultDeliveryDays || '2-5 days')}</span>
            </div>
          )}

          {/* Always-visible add to cart */}
          {pc.showAddToCart !== false && inStock && pc.addToCartStyle === 'always-visible' && (
            <button
              onClick={handleAddToCart}
              className="w-full mt-2 py-1.5 text-xs font-semibold text-white flex items-center justify-center gap-1 rounded transition-colors"
              style={{ backgroundColor: theme.primaryColor || '#1b5e35' }}
            >
              <IoCart size={13} />
              {pc.addToCartText || 'Add to Cart'}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
