import React from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';
import { getImageSizeStyle } from '@/utils/imageSizing';

// Convert hex color + opacity% to rgba string
function overlayRgba(color, opacity) {
  const c = color || '#000000';
  const o = (opacity ?? 0) / 100;
  if (o <= 0) return 'transparent';
  const r = parseInt(c.slice(1, 3), 16) || 0;
  const g = parseInt(c.slice(3, 5), 16) || 0;
  const b = parseInt(c.slice(5, 7), 16) || 0;
  return `rgba(${r},${g},${b},${o})`;
}

export default function BannerGrid2Col({ block }) {
  const banners = block.banners || [];
  if (!banners.length) return null;

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const renderBanner = (banner, className = '') => (
    <div className={`relative rounded-xl overflow-hidden group cursor-pointer ${className}`}>
      {banner.image ? (
        <img src={resolveImg(banner.image)} alt={banner.heading || ''} style={getImageSizeStyle(banner.imageWidth, banner.imageHeight)} className="group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      ) : (
        <div className="bg-gradient-to-br from-gray-100 to-gray-50" style={{ minHeight: '180px' }} />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: banner.overlayOpacity != null ? overlayRgba(banner.overlayColor, banner.overlayOpacity) : (banner.overlayColor || 'transparent') }} />
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-center">
        {banner.label && (
          <span className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: banner.textColor || '#333' }}>
            {banner.label}
          </span>
        )}
        {banner.heading && (
          <h3 className="text-lg font-bold mb-2 leading-snug" style={{ color: banner.textColor || '#333' }} dangerouslySetInnerHTML={{ __html: banner.heading.replace(/\n/g, '<br/>') }} />
        )}
        {banner.buttonText && banner.buttonLink && (
          <Link to={banner.buttonLink} className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors self-start" style={{ color: block.linkColor || block.primaryColor || '#0F604B' }}>
            {banner.buttonText}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        )}
      </div>
    </div>
  );

  // Layout: left = 1 large banner, right = 2 stacked smaller banners
  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners[0] && renderBanner(banners[0], 'md:row-span-2')}
        <div className="flex flex-col gap-4">
          {banners[1] && renderBanner(banners[1])}
          {banners[2] && renderBanner(banners[2])}
        </div>
      </div>
    </BlockWrapper>
  );
}
