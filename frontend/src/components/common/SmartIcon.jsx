import { getIconComponent } from '@/constants/iconCatalog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function resolveImageUrl(path) {
  if (!path) return '';
  if (typeof path === 'object' && path.url) return resolveImageUrl(path.url);
  if (typeof path !== 'string') return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * SmartIcon renders one of three shapes interchangeably:
 *   - emoji   : { type: 'emoji', value: '🎁' }   (or a bare string '🎁' for legacy data)
 *   - icon    : { type: 'icon',  value: 'cart' } (name from ICON_CATALOG)
 *   - image   : { type: 'image', value: '/uploads/foo.png' }
 *
 * Backward compat: a plain string is treated as an emoji. A nullish value
 * falls back to the `fallback` prop (also accepts the same shape).
 */
export default function SmartIcon({
  value,
  size = 24,
  className = '',
  color,
  fallback = null,
  alt = '',
}) {
  const desc = normalize(value) || normalize(fallback);
  if (!desc) return null;

  const styleSize = typeof size === 'number' ? `${size}px` : size;

  if (desc.type === 'icon') {
    const Cmp = getIconComponent(desc.value);
    if (!Cmp) return renderEmoji(desc.value, styleSize, className); // unknown icon name → render literally
    return (
      <Cmp
        size={typeof size === 'number' ? size : undefined}
        className={className}
        style={color ? { color } : undefined}
      />
    );
  }

  if (desc.type === 'image') {
    return (
      <img
        src={resolveImageUrl(desc.value)}
        alt={alt}
        className={className}
        style={{ width: styleSize, height: styleSize, objectFit: 'contain' }}
      />
    );
  }

  // emoji
  return renderEmoji(desc.value, styleSize, className, color);
}

function renderEmoji(value, size, className, color) {
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block', color }}
      role="img"
      aria-hidden="true"
    >
      {value}
    </span>
  );
}

function normalize(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'string') return { type: 'emoji', value: v };
  if (typeof v === 'object' && v.type && v.value) return v;
  return null;
}
