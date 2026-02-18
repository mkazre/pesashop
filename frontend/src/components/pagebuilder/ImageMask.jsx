import React from 'react';

const MASK_SHAPES = {
  circle: '50%',
  rounded: '20%',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
};

export const ImageMask = ({
  src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Masked+Image',
  alt = 'Masked image',
  maskShape = 'circle',
  width = '250px',
  height = '250px',
  className = '',
  style = {},
}) => {
  const shape = MASK_SHAPES[maskShape];
  const clipStyle = shape?.startsWith('polygon') ? { clipPath: shape } : { borderRadius: shape || '50%' };

  return (
    <div className={className} style={{ display: 'inline-block', overflow: 'hidden', width, height, ...clipStyle, ...style }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
};

ImageMask.craft = { displayName: 'Image Mask' };
