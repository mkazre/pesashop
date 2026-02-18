import React from 'react';

const PLATFORM_ICONS = {
  facebook: { icon: 'f', bg: '#1877f2' },
  twitter: { icon: '𝕏', bg: '#000' },
  instagram: { icon: '📷', bg: '#e4405f' },
  linkedin: { icon: 'in', bg: '#0a66c2' },
  youtube: { icon: '▶', bg: '#ff0000' },
  github: { icon: '⌂', bg: '#333' },
  pinterest: { icon: 'P', bg: '#bd081c' },
  tiktok: { icon: '♪', bg: '#000' },
};

export const SocialIcons = ({
  icons = [
    { platform: 'facebook', url: '#' },
    { platform: 'twitter', url: '#' },
    { platform: 'instagram', url: '#' },
  ],
  iconSize = '24px',
  iconColor = '#6b7280',
  gap = '12px',
  shape = 'circle',
  showBackground = false,
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', gap, alignItems: 'center', ...style }}>
    {icons.map((item, i) => {
      const platform = PLATFORM_ICONS[item.platform] || { icon: '?', bg: '#6b7280' };
      return (
        <a key={i} href={item.url || '#'} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: iconSize, height: iconSize, fontSize: `calc(${iconSize} * 0.5)`,
            color: showBackground ? '#fff' : iconColor,
            backgroundColor: showBackground ? platform.bg : 'transparent',
            borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? '6px' : '0',
            textDecoration: 'none', fontWeight: 700, lineHeight: 1,
          }}>
          {platform.icon}
        </a>
      );
    })}
  </div>
);

SocialIcons.craft = { displayName: 'Social Icons' };
