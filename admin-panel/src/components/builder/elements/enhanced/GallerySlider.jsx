import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const GallerySlider = ({
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
}) => {
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
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Images</h4><button onClick={() => setProp((p) => { p.images = [...(p.images||[]), { src: 'https://placehold.co/800x400/64748b/ffffff?text=New+Slide', alt: 'New', caption: 'New Slide' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {images.map((img, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Slide {i+1}</span><button onClick={() => setProp((p) => { p.images = p.images.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">Remove</button></div>
            <input type="text" value={img.src} onChange={(e) => setProp((p) => { p.images[i].src = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Image URL" />
            <input type="text" value={img.caption||''} onChange={(e) => setProp((p) => { p.images[i].caption = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Caption" />
          </div>
        ))}
      </div>
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
