import React from 'react';

export const MapEmbed = ({
  address = 'New York, NY',
  zoom = 14,
  height = '400px',
  className = '',
  style = {},
}) => (
  <div className={className} style={style}>
    <iframe
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`}
      style={{ width: '100%', height, border: 'none', borderRadius: '8px' }}
      loading="lazy"
      allowFullScreen
    />
  </div>
);

MapEmbed.craft = { displayName: 'Map Embed' };
