import React from 'react';
import { registerPreview } from './index';

// Preview renderers for Phase 2 (Enhanced + Extras) elements. Reuses the
// same lightweight live-HTML-preview approach as basicPreviews.jsx.

function styleToCSS(style = {}) {
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: style.textAlign,
    letterSpacing: style.letterSpacing,
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
  };
}

const ALERT_COLORS = {
  info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️' },
  success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✅' },
  warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
  error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
};

registerPreview('alert-box', ({ block }) => {
  const { type, title, message } = block.props || {};
  const c = ALERT_COLORS[type] || ALERT_COLORS.info;
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', gap: 10, padding: 14, background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 8 }}>
      <span>{c.icon}</span>
      <div>
        {!!title && <div style={{ fontWeight: 700 }}>{title}</div>}
        {!!message && <div style={{ fontSize: 13 }}>{message}</div>}
      </div>
    </div>
  );
});

registerPreview('animated-heading', ({ block }) => (
  <div style={styleToCSS(block.props?.style)}>{block.props?.text || 'Animated Heading'}</div>
));

registerPreview('back-to-top', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), display: 'inline-flex', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>↑</div>
));

registerPreview('before-after', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), height: block.props?.height || 260, background: '#e5e7eb', position: 'relative', display: 'flex' }}>
    <div style={{ flex: 1, background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#6b7280' }}>{block.props?.beforeLabel || 'Before'}</div>
    <div style={{ flex: 1, background: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>{block.props?.afterLabel || 'After'}</div>
  </div>
));

function slidesPreview(block) {
  const slides = Array.isArray(block.props?.slides) ? block.props.slides : [];
  const first = slides[0];
  return (
    <div style={{ ...styleToCSS(block.props?.style), height: block.props?.height || 240, background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
      {first?.src ? <img src={first.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="text-xs text-gray-400 h-full flex items-center justify-center">No slides added</div>}
    </div>
  );
}
registerPreview('carousel-builder', ({ block }) => slidesPreview(block));
registerPreview('content-slider', ({ block }) => slidesPreview(block));
registerPreview('gallery-slider', ({ block }) => slidesPreview(block));

registerPreview('circular-progress', ({ block }) => {
  const { value, size, progressColor, showPercentage, text } = block.props || {};
  const s = size || 120;
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: s, height: s, borderRadius: '50%', border: `6px solid ${progressColor || '#0F604B'}` }}>
      {showPercentage !== false && <div style={{ fontWeight: 700 }}>{value || 0}%</div>}
      {!!text && <div style={{ fontSize: 11, color: '#6b7280' }}>{text}</div>}
    </div>
  );
});

registerPreview('countdown', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), display: 'flex', gap: 16, justifyContent: 'center' }}>
    {['DD', 'HH', 'MM', 'SS'].map((u, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>00</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>{u}</div>
      </div>
    ))}
  </div>
));

registerPreview('dual-button', ({ block }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    <button type="button" disabled style={{ ...styleToCSS(block.props?.style), border: 'none', padding: '10px 18px' }}>{block.props?.primaryText || 'Primary'}</button>
    <button type="button" disabled style={{ padding: '10px 18px', border: '1px solid #d1d5db', background: '#fff' }}>{block.props?.secondaryText || 'Secondary'}</button>
  </div>
));

registerPreview('dual-color-text', ({ block }) => {
  const { text, splitPosition, firstColor, secondColor } = block.props || {};
  const t = text || '';
  const idx = Math.floor(((splitPosition ?? 50) / 100) * t.length);
  return (
    <div style={styleToCSS(block.props?.style)}>
      <span style={{ color: firstColor || '#0F604B' }}>{t.slice(0, idx)}</span>
      <span style={{ color: secondColor || '#111827' }}>{t.slice(idx)}</span>
    </div>
  );
});

registerPreview('fancy-heading', ({ block }) => (
  <div style={styleToCSS(block.props?.style)}>{block.props?.text || 'Fancy Heading'}</div>
));

registerPreview('highlighted-heading', ({ block }) => {
  const { beforeText, highlightText, afterText, highlightColor, highlightStyle } = block.props || {};
  const hl = highlightStyle === 'underline'
    ? { textDecoration: `underline ${highlightColor || '#fbbf24'}` }
    : highlightStyle === 'color'
    ? { color: highlightColor || '#fbbf24' }
    : { backgroundColor: highlightColor || '#fbbf24', padding: '0 4px' };
  return (
    <div style={styleToCSS(block.props?.style)}>
      {beforeText}<span style={hl}>{highlightText}</span>{afterText}
    </div>
  );
});

registerPreview('hotspot', ({ block }) => {
  const { image, markers } = block.props || {};
  const list = Array.isArray(markers) ? markers : [];
  return (
    <div style={{ ...styleToCSS(block.props?.style), position: 'relative', minHeight: 160, background: '#f3f4f6' }}>
      {image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      {list.map((m, i) => (
        <div key={i} style={{ position: 'absolute', left: `${m.x || 50}%`, top: `${m.y || 50}%`, width: 14, height: 14, borderRadius: 7, background: '#0F604B', border: '2px solid #fff', transform: 'translate(-50%,-50%)' }} />
      ))}
    </div>
  );
});

registerPreview('hover-animated-button', ({ block }) => (
  <button type="button" disabled style={{ ...styleToCSS(block.props?.style), border: 'none' }}>{block.props?.text || 'Tap Me'}</button>
));

registerPreview('icon-list', ({ block }) => {
  const items = Array.isArray(block.props?.items) ? block.props.items : [];
  const horizontal = block.props?.layout === 'horizontal';
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: 8, flexWrap: 'wrap' }}>
      {items.map((it, i) => {
        const label = it.icon?.type === 'emoji' ? it.icon.value : (it.icon?.type === 'icon' ? '✓' : '•');
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: it.color || '#22c55e' }}>{label}</span><span>{it.text}</span></div>;
      })}
    </div>
  );
});

const MASK_STYLES = {
  circle: { borderRadius: '50%' },
  rounded: { borderRadius: 20 },
  diamond: { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  hexagon: { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  star: { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
};
registerPreview('image-mask', ({ block }) => {
  const { src, maskShape, size } = block.props || {};
  const s = size || 220;
  return src ? (
    <img src={src} alt="" style={{ ...styleToCSS(block.props?.style), width: s * 0.6, height: s * 0.6, objectFit: 'cover', ...(MASK_STYLES[maskShape] || MASK_STYLES.circle) }} />
  ) : <div className="text-xs text-gray-400 text-center py-4">No image selected</div>;
});

registerPreview('image-panels', ({ block }) => {
  const panels = Array.isArray(block.props?.panels) ? block.props.panels : [];
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', height: block.props?.height || 260, gap: 4 }}>
      {panels.map((p, i) => (
        <div key={i} style={{ flex: 1, background: '#e5e7eb', position: 'relative', overflow: 'hidden' }}>
          {p.src && <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      ))}
    </div>
  );
});

registerPreview('lightbox', ({ block }) => {
  const images = Array.isArray(block.props?.images) ? block.props.images : [];
  const columns = block.props?.columns || 3;
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {images.map((img, i) => (
        img.src ? <img key={i} src={img.src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} /> : <div key={i} style={{ width: '100%', aspectRatio: '1', background: '#e5e7eb' }} />
      ))}
    </div>
  );
});

registerPreview('rating', ({ block }) => {
  const { value, max, label } = block.props || {};
  const v = value ?? 4, m = max || 5;
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', alignItems: 'center', gap: 8 }}>
      {!!label && <span style={{ fontSize: 13 }}>{label}</span>}
      <span style={{ color: block.props?.activeColor || '#fbbf24' }}>{'★'.repeat(v)}{'☆'.repeat(Math.max(0, m - v))}</span>
    </div>
  );
});

registerPreview('show-more-less', ({ block }) => (
  <div style={styleToCSS(block.props?.style)}>
    <div style={{ maxHeight: 60, overflow: 'hidden' }}>{block.props?.content}</div>
    <div style={{ fontSize: 12, color: '#0F604B', marginTop: 4 }}>{block.props?.moreText || 'Show More'}</div>
  </div>
));

registerPreview('tooltip', ({ block }) => (
  <span style={{ ...styleToCSS(block.props?.style), textDecoration: 'underline dashed #9ca3af' }}>{block.props?.triggerText || 'Tap for info'}</span>
));

registerPreview('ultimate-image', ({ block }) => {
  const { src, caption } = block.props || {};
  return (
    <div style={styleToCSS(block.props?.style)}>
      {src ? <img src={src} alt="" style={{ width: '100%', display: 'block', borderRadius: block.props?.style?.borderRadius }} /> : <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">No image selected</div>}
      {!!caption && <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>{caption}</div>}
    </div>
  );
});

registerPreview('ultimate-video', ({ block }) => {
  const { type, poster } = block.props || {};
  return (
    <div style={{ ...styleToCSS(block.props?.style), height: 140, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {poster && <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>▶</div>
      <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 10, color: '#fff', zIndex: 1 }}>{type || 'self'}</span>
    </div>
  );
});

registerPreview('adjacent-posts', ({ block }) => {
  const { prevLabel, prevTitle, nextLabel, nextTitle } = block.props || {};
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
      <div><div style={{ fontSize: 11, color: '#9ca3af' }}>{prevLabel}</div><div style={{ fontSize: 13, color: '#0F604B', fontWeight: 600 }}>{prevTitle}</div></div>
      <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: '#9ca3af' }}>{nextLabel}</div><div style={{ fontSize: 13, color: '#0F604B', fontWeight: 600 }}>{nextTitle}</div></div>
    </div>
  );
});

registerPreview('author-box', ({ block }) => {
  const { name, bio, avatar } = block.props || {};
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', gap: 12 }}>
      {avatar ? <img src={avatar} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} /> : <div style={{ width: 48, height: 48, borderRadius: 24, background: '#e5e7eb' }} />}
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{bio}</div></div>
    </div>
  );
});

registerPreview('content-switcher', ({ block }) => {
  const { labelA, labelB, contentA, activeColor } = block.props || {};
  return (
    <div style={styleToCSS(block.props?.style)}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: activeColor || '#0F604B' }}>{labelA}</span>
        <span style={{ color: '#9ca3af' }}>/</span>
        <span style={{ color: '#6b7280' }}>{labelB}</span>
      </div>
      <div style={{ fontSize: 13, color: '#374151' }}>{contentA}</div>
    </div>
  );
});

registerPreview('content-timeline', ({ block }) => {
  const items = Array.isArray(block.props?.items) ? block.props.items : [];
  return (
    <div style={{ ...styleToCSS(block.props?.style), paddingLeft: 20, position: 'relative' }}>
      {items.map((it, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: block.props?.dotColor || '#0F604B', fontWeight: 700 }}>{it.date}</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{it.title}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{it.description}</div>
        </div>
      ))}
    </div>
  );
});

registerPreview('copyright-year', ({ block }) => (
  <div style={styleToCSS(block.props?.style)}>{(block.props?.text || '').replace('{year}', new Date().getFullYear())}</div>
));

registerPreview('counter', ({ block }) => {
  const { endValue, prefix, suffix, title } = block.props || {};
  return (
    <div style={styleToCSS(block.props?.style)}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{prefix}{endValue ?? 1000}{suffix}</div>
      {!!title && <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>}
    </div>
  );
});

registerPreview('infinite-scroller', ({ block }) => {
  const items = Array.isArray(block.props?.items) ? block.props.items : [];
  return (
    <div style={{ ...styleToCSS(block.props?.style), whiteSpace: 'nowrap', overflow: 'hidden' }}>
      {items.map((it, i) => <span key={i}>{it.text}{i < items.length - 1 ? '  •  ' : ''}</span>)}
    </div>
  );
});

registerPreview('media-player', ({ block }) => {
  const { type, poster } = block.props || {};
  return type === 'audio' ? (
    <div style={{ ...styleToCSS(block.props?.style), height: 44, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6b7280' }}>♪ Audio player</div>
  ) : (
    <div style={{ ...styleToCSS(block.props?.style), height: 120, background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {poster && <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
      <span style={{ zIndex: 1, color: '#fff' }}>▶</span>
    </div>
  );
});

registerPreview('post-terms', ({ block }) => {
  const { taxonomy, terms } = block.props || {};
  const list = Array.isArray(terms) ? terms : [];
  return (
    <div style={styleToCSS(block.props?.style)}>
      {!!taxonomy && <span style={{ fontWeight: 600 }}>{taxonomy}: </span>}
      <span style={{ color: '#0F604B' }}>{list.map((t) => t.text).join(', ')}</span>
    </div>
  );
});

registerPreview('preloader', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid #e5e7eb`, borderTopColor: block.props?.color || '#0F604B' }} />
    {block.props?.showText !== false && <span style={{ fontSize: 12, color: '#6b7280' }}>{block.props?.text}</span>}
  </div>
));

registerPreview('reading-progress-bar', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), height: block.props?.height || 4, background: '#e5e7eb' }}>
    <div style={{ width: '45%', height: '100%', background: block.props?.color || '#0F604B' }} />
  </div>
));

registerPreview('reading-time', ({ block }) => (
  <span style={styleToCSS(block.props?.style)}>📖 {block.props?.text || '5 min read'}</span>
));

registerPreview('social-share-buttons', ({ block }) => {
  const platforms = Array.isArray(block.props?.platforms) ? block.props.platforms : [];
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', gap: 8 }}>
      {platforms.map((p, i) => <div key={i} style={{ width: 28, height: 28, borderRadius: 14, background: '#0F604B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{p[0].toUpperCase()}</div>)}
    </div>
  );
});

registerPreview('table-of-contents', ({ block }) => {
  const { title, items } = block.props || {};
  const list = Array.isArray(items) ? items : [];
  return (
    <div style={styleToCSS(block.props?.style)}>
      {!!title && <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{title}</div>}
      {list.map((it, i) => <div key={i} style={{ fontSize: 12, color: '#374151', paddingLeft: ((it.level || 1) - 1) * 12 }}>{it.text}</div>)}
    </div>
  );
});

registerPreview('toggle-switch', ({ block }) => {
  const { label, defaultChecked, activeColor } = block.props || {};
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'flex', alignItems: 'center', gap: 8 }}>
      {!!label && <span style={{ fontSize: 13 }}>{label}</span>}
      <div style={{ width: 40, height: 22, borderRadius: 11, background: defaultChecked ? (activeColor || '#0F604B') : '#d1d5db', position: 'relative' }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, left: defaultChecked ? 20 : 2 }} />
      </div>
    </div>
  );
});
