import React from 'react';

export const UltimateImage = ({
  src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Ultimate+Image',
  alt = 'Ultimate Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = '8px',
  caption = '',
  captionColor = '#6b7280',
  captionSize = '13px',
  linkUrl = '',
  className = '',
  style = {},
}) => {
  const img = (
    <figure className={className} style={{ margin: 0, overflow: 'hidden', borderRadius, ...style }}>
      <img src={src} alt={alt} style={{ width, height, objectFit, display: 'block', borderRadius }} />
      {caption && (
        <figcaption style={{ padding: '8px 0', fontSize: captionSize, color: captionColor, textAlign: 'center' }}>{caption}</figcaption>
      )}
    </figure>
  );
  if (linkUrl) return <a href={linkUrl} style={{ display: 'block', textDecoration: 'none' }}>{img}</a>;
  return img;
};

UltimateImage.craft = { displayName: 'Ultimate Image' };
