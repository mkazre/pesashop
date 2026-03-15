import React from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';

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

export default function BannerFullWidth({ block }) {
  const banner = block.banners?.[0];
  if (!banner) return null;

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ minHeight: '240px' }}
      >
        {banner.image ? (
          <img
            src={resolveImg(banner.image)}
            alt={banner.heading || ''}
            className="w-full h-full object-cover absolute inset-0"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50" />
        )}
        <div className="absolute inset-0" style={{ backgroundColor: banner.overlayOpacity != null ? overlayRgba(banner.overlayColor, banner.overlayOpacity) : (banner.overlayColor || 'transparent') }} />
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center h-full max-w-2xl">
          {banner.subtitle && (
            <p className="text-sm font-medium mb-2" style={{ color: banner.textColor || '#333' }}>
              {banner.subtitle}
            </p>
          )}
          {banner.heading && (
            <h2
              className="text-2xl md:text-4xl font-bold mb-4 leading-tight"
              style={{ color: banner.textColor || '#333' }}
              dangerouslySetInnerHTML={{ __html: banner.heading.replace(/\n/g, '<br/>') }}
            />
          )}
          {banner.buttonText && banner.buttonLink && (
            <Link
              to={banner.buttonLink}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors self-start"
              style={{ backgroundColor: block.buttonBgColor || block.primaryColor || '#0F604B' }}
            >
              {banner.buttonText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
        </div>
      </div>
    </BlockWrapper>
  );
}
