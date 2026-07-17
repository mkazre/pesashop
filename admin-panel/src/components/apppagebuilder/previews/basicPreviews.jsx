import React from 'react';
import { registerPreview } from './index';

// Lightweight live-HTML previews for canvas cards — render block.props.style
// as real inline CSS so the card looks genuinely styled, without needing a
// bespoke preview component per element beyond this handful.

function styleToCSS(style = {}) {
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight ? `${style.lineHeight}px` : undefined,
    letterSpacing: style.letterSpacing,
    backgroundColor: style.backgroundColor,
    borderWidth: style.borderWidth,
    borderColor: style.borderColor,
    borderStyle: style.borderWidth ? 'solid' : undefined,
    borderRadius: style.borderRadius,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    marginTop: style.marginTop,
    marginRight: style.marginRight,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    width: style.width,
    opacity: style.opacity,
  };
}

registerPreview('heading', ({ block }) => {
  const { text, level } = block.props || {};
  const Tag = level || 'h2';
  return <Tag style={styleToCSS(block.props?.style)}>{text || 'Heading text'}</Tag>;
});

registerPreview('text', ({ block }) => (
  <p style={styleToCSS(block.props?.style)}>{block.props?.text || ''}</p>
));

registerPreview('image', ({ block }) => {
  const { src, alt } = block.props || {};
  return src ? (
    <img src={src} alt={alt || ''} style={{ ...styleToCSS(block.props?.style), maxWidth: '100%', display: 'block' }} />
  ) : (
    <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">No image selected</div>
  );
});

registerPreview('button', ({ block }) => (
  <button type="button" style={{ ...styleToCSS(block.props?.style), border: 'none', display: 'inline-block' }} disabled>
    {block.props?.text || 'Button'}
  </button>
));

registerPreview('container', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), minHeight: 24, border: '1px dashed #d1d5db' }}>
    <span className="text-[10px] text-gray-400">Container ({block.props?.direction || 'column'}) — {(block.children || []).length} child block(s)</span>
  </div>
));

registerPreview('list', ({ block }) => {
  const items = Array.isArray(block.props?.items) ? block.props.items : [];
  return (
    <ul style={{ ...styleToCSS(block.props?.style), listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 4 }}>• {item.text}</li>
      ))}
    </ul>
  );
});

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

registerPreview('video', ({ block }) => {
  const { src } = block.props || {};
  if (!src) return <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">No video selected</div>;
  return VIDEO_EXT_RE.test(src)
    ? <video src={src} style={{ ...styleToCSS(block.props?.style), width: '100%', maxHeight: 140 }} muted controls />
    : <img src={src} alt="" style={{ ...styleToCSS(block.props?.style), width: '100%', maxHeight: 140, objectFit: 'cover' }} />;
});

registerPreview('gallery', ({ block }) => {
  const images = Array.isArray(block.props?.images) ? block.props.images : [];
  const columns = block.props?.columns || 2;
  if (!images.length) return <div className="text-xs text-gray-400 text-center py-4">No images added</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {images.map((img, i) => (
        img.src ? <img key={i} src={img.src} alt={img.caption || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: block.props?.style?.borderRadius }} /> : null
      ))}
    </div>
  );
});

registerPreview('link-button', ({ block }) => (
  <button type="button" style={{ ...styleToCSS(block.props?.style), border: 'none', display: 'inline-block' }} disabled>
    {block.props?.text || 'Learn more'}
  </button>
));

registerPreview('link-text', ({ block }) => (
  <span style={{ ...styleToCSS(block.props?.style), textDecoration: 'underline', color: block.props?.style?.color || '#0F604B' }}>
    {block.props?.text || 'Read more'}
  </span>
));

registerPreview('link-wrapper', ({ block }) => (
  <div style={{ ...styleToCSS(block.props?.style), border: '1px dashed #d1d5db', padding: 8 }}>
    <span className="text-[10px] text-gray-400">Link Wrapper → {block.props?.link || '/'} — {(block.children || []).length} child block(s)</span>
  </div>
));

registerPreview('fancy-icon', ({ block }) => {
  const icon = block.props?.icon;
  const label = icon?.type === 'emoji' ? icon.value : (icon?.type === 'icon' ? `[${icon.value}]` : '—');
  return (
    <div style={{ ...styleToCSS(block.props?.style), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
      <span style={{ fontSize: 20 }}>{label}</span>
    </div>
  );
});

registerPreview('rich-text', ({ block }) => (
  <div style={styleToCSS(block.props?.style)} dangerouslySetInnerHTML={{ __html: block.props?.html || '' }} />
));

registerPreview('text-block', ({ block }) => (
  <div style={styleToCSS(block.props?.style)} dangerouslySetInnerHTML={{ __html: block.props?.html || '' }} />
));

registerPreview('span', ({ block }) => (
  <span style={styleToCSS(block.props?.style)}>{block.props?.text || ''}</span>
));

registerPreview('code-block', ({ block }) => (
  <pre style={{ background: '#1f2937', color: '#e5e7eb', padding: 10, fontSize: 11, overflowX: 'auto', margin: 0 }}>
    {block.props?.code || ''}
  </pre>
));

registerPreview('svg-icon', ({ block }) => (
  block.props?.svg
    ? <div style={{ width: block.props?.size || 32, height: block.props?.size || 32 }} dangerouslySetInnerHTML={{ __html: block.props.svg }} />
    : <div className="text-xs text-gray-400 text-center py-2">No SVG markup</div>
));
