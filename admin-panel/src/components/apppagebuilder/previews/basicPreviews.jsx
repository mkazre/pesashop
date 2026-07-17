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
