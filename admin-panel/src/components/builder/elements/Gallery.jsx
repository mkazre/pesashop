import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';

export const Gallery = ({
  images = [
    { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+1', alt: 'Image 1' },
    { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+2', alt: 'Image 2' },
    { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+3', alt: 'Image 3' },
  ],
  columns = 3,
  gap = '8px',
  lightbox = true,
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [lightboxIndex, setLightboxIndex] = useState(-1);

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`gallery-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
          gap: effectiveGap,
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            style={{ overflow: 'hidden', borderRadius: '4px', cursor: lightbox ? 'pointer' : 'default' }}
            onClick={() => lightbox && setLightboxIndex(i)}
          >
            <img
              src={img.src}
              alt={img.alt || `Image ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        ))}
      </div>

      {lightbox && lightboxIndex >= 0 && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
          onClick={() => setLightboxIndex(-1)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(0, lightboxIndex - 1)); }}
            style={{ position: 'absolute', left: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ‹
          </button>
          <img
            src={images[lightboxIndex]?.src}
            alt={images[lightboxIndex]?.alt}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1)); }}
            style={{ position: 'absolute', right: 20, color: '#fff', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ›
          </button>
          <button
            onClick={() => setLightboxIndex(-1)}
            style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export const GallerySettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const { images = [], columns = 3, gap = '8px', lightbox = true } = props;

  const addImage = () => {
    setProp((p) => {
      if (!p.images) p.images = [];
      p.images = [...p.images, { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=New+Image', alt: 'New Image' }];
    });
  };

  const removeImage = (index) => {
    setProp((p) => {
      p.images = p.images.filter((_, i) => i !== index);
    });
  };

  const updateImage = (index, key, value) => {
    setProp((p) => {
      if (p.images[index]) p.images[index][key] = value;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Columns</label>
            <select
              value={columns}
              onChange={(e) => setProp((p) => { p.columns = Number(e.target.value); })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gap</label>
            <input
              type="text"
              value={gap}
              onChange={(e) => setProp((p) => { p.gap = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="8px"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lightbox} onChange={(e) => setProp((p) => { p.lightbox = e.target.checked; })} />
          Enable Lightbox
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Images</h4>
          <button onClick={addImage} className="text-xs text-blue-600 hover:text-blue-800">+ Add Image</button>
        </div>
        {images.map((img, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Image {i + 1}</span>
              <button onClick={() => removeImage(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <input
              type="text"
              value={img.src}
              onChange={(e) => updateImage(i, 'src', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Image URL"
            />
            <input
              type="text"
              value={img.alt || ''}
              onChange={(e) => updateImage(i, 'alt', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              placeholder="Alt text"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

Gallery.craft = {
  displayName: 'Gallery',
  props: {
    images: [
      { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+1', alt: 'Image 1' },
      { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+2', alt: 'Image 2' },
      { src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image+3', alt: 'Image 3' },
    ],
    columns: 3,
    gap: '8px',
    lightbox: true,
    responsiveProps: {},
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
