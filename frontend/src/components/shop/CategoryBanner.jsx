const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

export default function CategoryBanner({ category, settings = {}, totalProducts = 0, isShopPage = false }) {
  const ph = settings?.pageHeader || {};

  if (ph.enabled === false) return null;

  // Determine banner image + text
  let bannerImage = '';
  let title = '';
  let description = '';
  let showProductCount = ph.showProductCount !== false;

  if (isShopPage) {
    bannerImage = ph.defaultBannerImage ? getImageSrc(ph.defaultBannerImage) : '';
    title = ph.defaultBannerTitle || 'Our Products';
    description = ph.defaultBannerDescription || 'Browse our full range of products';
  } else if (category) {
    bannerImage = category.bannerImage?.url ? getImageSrc(category.bannerImage.url) : (ph.defaultBannerImage ? getImageSrc(ph.defaultBannerImage) : '');
    title = category.name || '';
    description = category.description || '';
    // Respect per-category banner settings if available
    const bs = category.bannerSettings || {};
    if (bs.showTitle === false) title = '';
    if (bs.showDescription === false) description = '';
    if (bs.showProductCount === false) showProductCount = false;
  }

  if (!bannerImage && ph.showCategoryBanner === false) return null;

  const bannerHeight = ph.bannerHeight || '220px';
  const overlayColor = category?.bannerSettings?.overlayColor || ph.bannerOverlayColor || 'rgba(0,0,0,0.45)';
  const textColor = category?.bannerSettings?.textColor || ph.bannerTextColor || '#ffffff';
  const textAlign = category?.bannerSettings?.textAlign || 'center';

  // If no banner image at all, render a simple header
  if (!bannerImage) {
    return (
      <div className="mb-6">
        {ph.showTitle !== false && title && (
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontSize: (ph.bannerTitleSize || 32) + 'px' }}>
            {title}
          </h1>
        )}
        {ph.showDescription !== false && description && (
          <p className="text-gray-600 mt-2" style={{ fontSize: (ph.bannerDescriptionSize || 14) + 'px' }}>
            {description}
          </p>
        )}
        {showProductCount && (
          <p className="text-sm text-gray-500 mt-1">{totalProducts} products</p>
        )}
      </div>
    );
  }

  // Banner with image
  return (
    <div
      className="relative overflow-hidden mb-6"
      style={{ height: bannerHeight, borderRadius: '8px' }}
    >
      <img
        src={bannerImage}
        alt={title || 'Category banner'}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 flex flex-col justify-center px-8"
        style={{ backgroundColor: overlayColor, textAlign, color: textColor }}
      >
        <div className={`max-w-2xl ${textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto' : ''}`}>
          {ph.showTitle !== false && title && (
            <h1 className="font-bold leading-tight" style={{ fontSize: (ph.bannerTitleSize || 32) + 'px' }}>
              {title}
            </h1>
          )}
          {ph.showDescription !== false && description && (
            <p className="mt-2 opacity-90" style={{ fontSize: (ph.bannerDescriptionSize || 14) + 'px' }}>
              {description}
            </p>
          )}
          {showProductCount && (
            <p className="mt-2 text-sm opacity-75">{totalProducts} products found</p>
          )}
        </div>
      </div>
    </div>
  );
}
