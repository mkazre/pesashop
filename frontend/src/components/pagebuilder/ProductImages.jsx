import React, { useState, useEffect } from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductImages = ({
  mainImage = 'https://placehold.co/600x600/e2e8f0/64748b?text=Product+Image',
  thumbnails = [
    'https://placehold.co/100x100/e2e8f0/64748b?text=1',
    'https://placehold.co/100x100/e2e8f0/64748b?text=2',
    'https://placehold.co/100x100/e2e8f0/64748b?text=3',
  ],
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const displayMainImage = product?.featuredImage || product?.images?.[0] || mainImage;
  const displayThumbnails = product?.images?.length > 1 ? product.images.slice(1) : (product ? [] : thumbnails);
  const [activeImage, setActiveImage] = useState(displayMainImage);

  // Reset active image when product changes (e.g. navigating between products)
  useEffect(() => {
    setActiveImage(displayMainImage);
  }, [displayMainImage]);

  return (
    <div className={className} style={style}>
      <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
        <img src={activeImage} alt={repeaterItem?.name || 'Product'} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
      </div>
      {displayThumbnails.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {[displayMainImage, ...displayThumbnails].map((thumb, i) => (
            <img key={i} src={thumb} alt={`Thumbnail ${i + 1}`}
              onClick={() => setActiveImage(thumb)}
              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: activeImage === thumb ? '2px solid #3b82f6' : '2px solid transparent', opacity: activeImage === thumb ? 1 : 0.6, transition: 'all 0.2s', flexShrink: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
};

ProductImages.craft = { displayName: 'Product Images' };
