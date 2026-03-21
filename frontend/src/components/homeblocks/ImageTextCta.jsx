import React from 'react';
import { Link } from 'react-router-dom';
import BlockWrapper from './BlockWrapper';

export default function ImageTextCta({ block }) {
  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const layoutMap = {
    '8-4': { main: 'lg:col-span-8', side: 'lg:col-span-4' },
    '6-6': { main: 'lg:col-span-6', side: 'lg:col-span-6' },
    '4-8': { main: 'lg:col-span-4', side: 'lg:col-span-8' },
    'full': { main: 'lg:col-span-12', side: '' },
  };
  const layout = layoutMap[block.layout] || layoutMap['8-4'];
  const isFullWidth = block.layout === 'full';

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main image with text overlay */}
        <div className={`${layout.main} col-span-12`}>
          <div className="relative rounded-xl overflow-hidden min-h-[300px] md:min-h-[400px]">
            {block.mainImage ? (
              <img
                src={resolveImg(block.mainImage)}
                alt={block.heading || ''}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" />
            )}
            <div
              className={`relative z-10 h-full flex flex-col justify-center p-8 md:p-12 ${
                block.textPosition === 'center' ? 'items-center text-center' :
                block.textPosition === 'left' ? 'items-start text-left' :
                'items-end text-right'
              }`}
              style={{ maxWidth: isFullWidth ? '600px' : undefined, marginLeft: block.textPosition === 'right' ? 'auto' : undefined }}
            >
              {block.heading && (
                <h2
                  className="text-2xl md:text-3xl font-bold mb-3"
                  style={{ color: block.textColor || '#333333' }}
                >
                  {block.heading}
                </h2>
              )}
              {block.description && (
                <p
                  className="text-sm md:text-base mb-4 opacity-80"
                  style={{ color: block.textColor || '#333333' }}
                >
                  {block.description}
                </p>
              )}
              {block.bulletPoints?.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {block.bulletPoints.map((point, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: block.primaryColor || '#0F604B' }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className="text-sm" style={{ color: block.textColor || '#333333' }}>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {block.buttonText && block.buttonLink && (
                <Link
                  to={block.buttonLink}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  style={{ backgroundColor: block.buttonBgColor || block.primaryColor || '#0F604B' }}
                >
                  {block.buttonText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Side image */}
        {!isFullWidth && layout.side && block.sideImage && (
          <div className={`${layout.side} col-span-12`}>
            <div className="rounded-xl overflow-hidden h-full min-h-[200px]">
              <img
                src={resolveImg(block.sideImage)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </BlockWrapper>
  );
}
