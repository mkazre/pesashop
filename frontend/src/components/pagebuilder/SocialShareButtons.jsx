import React from 'react';

const PLATFORMS = [
  { name: 'facebook', label: 'Facebook', color: '#1877f2', getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'twitter', label: 'Twitter', color: '#000', getUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: 'linkedin', label: 'LinkedIn', color: '#0a66c2', getUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { name: 'email', label: 'Email', color: '#6b7280', getUrl: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
];

export const SocialShareButtons = ({
  platforms = ['facebook', 'twitter', 'linkedin', 'email'],
  url = '',
  title = '',
  layout = 'horizontal',
  showLabels = true,
  buttonStyle = 'filled',
  className = '',
  style = {},
}) => {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const filtered = PLATFORMS.filter((p) => platforms.includes(p.name));

  return (
    <div className={className} style={{ display: 'flex', flexDirection: layout === 'vertical' ? 'column' : 'row', gap: '8px', flexWrap: 'wrap', ...style }}>
      {filtered.map((p) => (
        <a key={p.name} href={p.getUrl(shareUrl, shareTitle)} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'opacity 0.2s',
            backgroundColor: buttonStyle === 'filled' ? p.color : 'transparent',
            color: buttonStyle === 'filled' ? '#fff' : p.color,
            border: buttonStyle === 'outline' ? `2px solid ${p.color}` : 'none',
          }}>
          {showLabels && p.label}
        </a>
      ))}
    </div>
  );
};

SocialShareButtons.craft = { displayName: 'Social Share Buttons' };
