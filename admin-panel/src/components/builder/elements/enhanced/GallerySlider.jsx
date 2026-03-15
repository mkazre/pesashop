import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Image as ImageIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const GallerySlider = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  images = [
    { src: 'https://placehold.co/800x400/3b82f6/ffffff?text=Slide+1', alt: 'Slide 1', caption: 'First Slide' },
    { src: 'https://placehold.co/800x400/8b5cf6/ffffff?text=Slide+2', alt: 'Slide 2', caption: 'Second Slide' },
    { src: 'https://placehold.co/800x400/ec4899/ffffff?text=Slide+3', alt: 'Slide 3', caption: 'Third Slide' },
  ],
  height = '400px',
  showCaptions = true,
  showDots = true,
  showArrows = true,
  autoplay = false,
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`gallery-slider ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', height, ...style }}>
      {images.map((img, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.5s ease' }}>
          <img src={img.src} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {showCaptions && img.caption && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', color: '#fff', fontSize: '16px', fontWeight: 500 }}>{img.caption}</div>
          )}
        </div>
      ))}
      {showArrows && images.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>‹</button>
          <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
        </>
      )}
      {showDots && images.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      )}
    </div>
  );
};

export const GallerySliderSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { images = [], height = '400px', showCaptions = true, showDots = true, showArrows = true, autoplay = false } = props;
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);

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
        <h4 className="text-sm font-medium text-gray-700">Settings</h4>
        <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCaptions} onChange={(e) => setProp((p) => { p.showCaptions = e.target.checked; })} />Show Captions</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showDots} onChange={(e) => setProp((p) => { p.showDots = e.target.checked; })} />Show Dots</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArrows} onChange={(e) => setProp((p) => { p.showArrows = e.target.checked; })} />Show Arrows</label>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Images ({images.length})</h4>
          <button onClick={() => setProp((p) => { p.images = [...(p.images||[]), { src: '', alt: 'New', caption: 'New Slide' }]; })} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+ Add</button>
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
                <span className="text-sm font-medium text-gray-700">Slide {i+1}</span>
              </div>
              {images.length > 1 && (
                <button onClick={() => setProp((p) => { p.images = p.images.filter((_,idx) => idx !== i); })}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Image preview + media library */}
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

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
              <input type="text" value={img.caption||''} onChange={(e) => setProp((p) => { p.images[i].caption = e.target.value; })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Caption" />
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

GallerySlider.craft = {
  displayName: 'Gallery Slider',
  props: { images: [{ src: 'https://placehold.co/800x400/3b82f6/ffffff?text=Slide+1', alt: 'Slide 1', caption: 'First Slide' }, { src: 'https://placehold.co/800x400/8b5cf6/ffffff?text=Slide+2', alt: 'Slide 2', caption: 'Second Slide' }, { src: 'https://placehold.co/800x400/ec4899/ffffff?text=Slide+3', alt: 'Slide 3', caption: 'Third Slide' }], height: '400px', showCaptions: true, showDots: true, showArrows: true, autoplay: false, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
