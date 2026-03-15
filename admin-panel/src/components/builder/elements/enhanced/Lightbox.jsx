import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Image as ImageIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Lightbox = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
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
} = resolved;

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
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const { images = [], columns = 3, gap = '8px', thumbBorderRadius = '8px' } = props;

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    setProp((p) => {
      const arr = [...(p.images || images)];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      p.images = arr;
    });
  };

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
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Images ({images.length})</h4>
          <button onClick={() => setProp((p) => { p.images = [...(p.images||[]), { src: '', alt: 'New' }]; })} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+ Add</button>
        </div>
        {images.map((img, i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="flex flex-col">
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp size={12} /></button>
                  <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown size={12} /></button>
                </div>
                <span className="text-sm font-medium text-gray-700">Image {i+1}</span>
              </div>
              {images.length > 1 && (
                <button onClick={() => setProp((p) => { p.images = p.images.filter((_,idx) => idx !== i); })}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              {img.src ? (
                <div className="relative group rounded-md overflow-hidden border border-gray-200 mb-1">
                  <img src={img.src} alt={img.alt || ''} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => { setMediaTarget(i); setMediaOpen(true); }}
                      className="px-2 py-1 text-xs bg-white text-gray-700 rounded shadow hover:bg-gray-100">Replace</button>
                    <button onClick={() => setProp((p) => { p.images[i].src = ''; })}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded shadow hover:bg-red-600">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setMediaTarget(i); setMediaOpen(true); }}
                  className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <ImageIcon size={20} />
                  <span className="text-xs">Choose Image</span>
                </button>
              )}
              <input type="text" value={img.src || ''} onChange={(e) => setProp((p) => { p.images[i].src = e.target.value; })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs mt-1" placeholder="Or paste image URL" />
            </div>
          </div>
        ))}
      </div>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => { setMediaOpen(false); setMediaTarget(null); }}
        onSelect={(url) => {
          if (mediaTarget !== null) setProp((p) => { p.images[mediaTarget].src = url; });
          setMediaOpen(false);
          setMediaTarget(null);
        }}
      />
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
