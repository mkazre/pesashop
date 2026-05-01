import React from 'react';
import BlockWrapper from './BlockWrapper';
import SmartIcon from '@/components/common/SmartIcon';

export default function FeatureIconsRow({ block }) {
  const features = block.features || [];
  if (!features.length) return null;

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  return (
    <BlockWrapper block={block}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center p-4 rounded-xl hover:shadow-md transition-all duration-300 bg-white border border-gray-100"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${f.color || '#1b5e35'}15` }}
            >
              {f.iconImage ? (
                <img src={resolveImg(f.iconImage)} alt={f.title} className="w-8 h-8 object-contain" />
              ) : (
                <SmartIcon value={f.icon} fallback="⭐" size={28} color={f.color || '#1b5e35'} />
              )}
            </div>
            <h4 className="text-sm font-bold text-gray-800" style={{ color: f.color || '#1b5e35' }}>
              {f.title}
            </h4>
            {f.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{f.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </BlockWrapper>
  );
}
