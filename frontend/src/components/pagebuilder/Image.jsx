import React from 'react';
import { useDynamicProps } from './useDynamicProps';

const API_URL = import.meta.env.VITE_API_URL || '';

/** View-only Image for page builder */
export const Image = (rawProps) => {
  const { src = '', alt = 'Image', className = '', style = {}, width = '100%', height = 'auto' } = useDynamicProps(rawProps);
  const imgSrc = src?.startsWith('/uploads/') ? `${API_URL}${src}` : src;
  return (
    <div className={`image-wrapper ${className}`} style={style}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          style={{ width, height, objectFit: 'contain' }}
          className="max-w-full"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 p-8 text-gray-400">
          <span className="text-sm">No image</span>
        </div>
      )}
    </div>
  );
};

Image.craft = { displayName: 'Image' };
