import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Lightbox = ({
  images = [
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+1', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+1', alt: 'Photo 1' },
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+2', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+2', alt: 'Photo 2' },
    { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+3', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+3', alt: 'Photo 3' },
  ],
  columns = 3,
  gap = '8px',
  thumbBorderRadius = '8px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`lightbox-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setActiveIndex(i)} style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: thumbBorderRadius }}>
            <img src={img.thumb || img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} />
          </div>
        ))}
      </div>
      {activeIndex >= 0 && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setActiveIndex(-1)}>
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex(Math.max(0, activeIndex - 1)); }} style={{ position: 'absolute', left: 20, color: '#fff', fontSize: 36, background: 'none', border: 'none', cursor: 'pointer' }}>‹</button>
          <img src={images[activeIndex]?.src} alt={images[activeIndex]?.alt} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex(Math.min(images.length - 1, activeIndex + 1)); }} style={{ position: 'absolute', right: 20, color: '#fff', fontSize: 36, background: 'none', border: 'none', cursor: 'pointer' }}>›</button>
          <button onClick={() => setActiveIndex(-1)} style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          <div style={{ position: 'absolute', bottom: 20, color: '#fff', fontSize: 14 }}>{activeIndex + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
};

export const LightboxSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { images = [], columns = 3, gap = '8px', thumbBorderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Columns</label><select value={columns} onChange={(e) => setProp((p) => { p.columns = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Images</h4><button onClick={() => setProp((p) => { p.images = [...(p.images||[]), { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=New', alt: 'New' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {images.map((img, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Image {i+1}</span><button onClick={() => setProp((p) => { p.images = p.images.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">Remove</button></div>
            <input type="text" value={img.src} onChange={(e) => setProp((p) => { p.images[i].src = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Image URL" />
          </div>
        ))}
      </div>
    </div>
  );
};

Lightbox.craft = {
  displayName: 'Lightbox',
  props: { images: [{ src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+1', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+1', alt: 'Photo 1' }, { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+2', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+2', alt: 'Photo 2' }, { src: 'https://placehold.co/600x400/e2e8f0/64748b?text=Photo+3', thumb: 'https://placehold.co/200x150/e2e8f0/64748b?text=Photo+3', alt: 'Photo 3' }], columns: 3, gap: '8px', thumbBorderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
