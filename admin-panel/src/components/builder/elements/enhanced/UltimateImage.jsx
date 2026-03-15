import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const UltimateImage = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Ultimate+Image',
  alt = 'Ultimate Image',
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = '8px',
  hoverEffect = 'none',
  caption = '',
  captionColor = '#6b7280',
  captionSize = '13px',
  linkUrl = '',
  lightbox = false,
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  const hoverStyles = {
    none: {},
    zoom: { transition: 'transform 0.3s ease', ':hover': { transform: 'scale(1.05)' } },
    grayscale: { filter: 'grayscale(100%)', transition: 'filter 0.3s ease' },
    blur: { transition: 'filter 0.3s ease' },
  };

  return (
    <figure ref={(ref) => connect(drag(ref))} className={className}
      style={{ margin: 0, overflow: 'hidden', borderRadius, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <img src={src} alt={alt} style={{ width, height, objectFit, display: 'block', borderRadius, ...hoverStyles[hoverEffect] }} />
      {caption && (
        <figcaption style={{ padding: '8px 0', fontSize: captionSize, color: captionColor, textAlign: 'center' }}>{caption}</figcaption>
      )}
    </figure>
  );
};

export const UltimateImageSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'src', label: 'Image URL' }, { key: 'alt', label: 'Alt Text' }, { key: 'caption', label: 'Caption' }, { key: 'linkUrl', label: 'Link URL' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="text" value={props[key] || ''} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ))}
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Object Fit</label>
      <select value={props.objectFit || 'cover'} onChange={(e) => setProp((p) => { p.objectFit = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        {['cover', 'contain', 'fill', 'none', 'scale-down'].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Hover Effect</label>
      <select value={props.hoverEffect || 'none'} onChange={(e) => setProp((p) => { p.hoverEffect = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        {['none', 'zoom', 'grayscale', 'blur'].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Border Radius</label>
      <input type="text" value={props.borderRadius || '8px'} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={!!props.lightbox} onChange={(e) => setProp((p) => { p.lightbox = e.target.checked; })} /> Enable Lightbox
      </label>
    </div>
  );
};

UltimateImage.craft = {
  displayName: 'Ultimate Image',
  props: { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Ultimate+Image', alt: 'Ultimate Image', width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px', hoverEffect: 'none', caption: '', captionColor: '#6b7280', captionSize: '13px', linkUrl: '', lightbox: false, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: UltimateImageSettings },
};
