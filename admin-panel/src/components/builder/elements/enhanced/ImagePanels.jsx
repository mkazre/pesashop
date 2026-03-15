import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Image as ImageIcon, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ImagePanels = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  panels = [
    { src: 'https://placehold.co/400x600/3b82f6/ffffff?text=Panel+1', title: 'Panel 1' },
    { src: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Panel+2', title: 'Panel 2' },
    { src: 'https://placehold.co/400x600/ec4899/ffffff?text=Panel+3', title: 'Panel 3' },
    { src: 'https://placehold.co/400x600/f59e0b/ffffff?text=Panel+4', title: 'Panel 4' },
  ],
  height = '400px',
  gap = '4px',
  textColor = '#ffffff',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`image-panels ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', height, gap, overflow: 'hidden', borderRadius: '8px', ...style }}>
      {panels.map((panel, i) => (
        <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'flex 0.4s ease' }}
          className="hover:!flex-[3]">
          <img src={panel.src} alt={panel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
            <span style={{ color: textColor, fontSize: '14px', fontWeight: 600 }}>{panel.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ImagePanelsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const { panels = [], height = '400px', gap = '4px' } = props;

  const movePanel = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= panels.length) return;
    setProp((p) => {
      const arr = [...(p.panels || panels)];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      p.panels = arr;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Panels ({panels.length})</h4>
          <button onClick={() => setProp((p) => { p.panels = [...(p.panels||[]), { src: '', title: 'New Panel' }]; })} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+ Add</button>
        </div>
        {panels.map((panel, i) => (
          <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="flex flex-col">
                  <button onClick={() => movePanel(i, -1)} disabled={i === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp size={12} /></button>
                  <button onClick={() => movePanel(i, 1)} disabled={i === panels.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown size={12} /></button>
                </div>
                <span className="text-sm font-medium text-gray-700">Panel {i+1}</span>
              </div>
              {panels.length > 1 && (
                <button onClick={() => setProp((p) => { p.panels = p.panels.filter((_,idx) => idx !== i); })}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              {panel.src ? (
                <div className="relative group rounded-md overflow-hidden border border-gray-200 mb-1">
                  <img src={panel.src} alt={panel.title || ''} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => { setMediaTarget(i); setMediaOpen(true); }}
                      className="px-2 py-1 text-xs bg-white text-gray-700 rounded shadow hover:bg-gray-100">Replace</button>
                    <button onClick={() => setProp((p) => { p.panels[i].src = ''; })}
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
              <input type="text" value={panel.src || ''} onChange={(e) => setProp((p) => { p.panels[i].src = e.target.value; })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs mt-1" placeholder="Or paste image URL" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input type="text" value={panel.title} onChange={(e) => setProp((p) => { p.panels[i].title = e.target.value; })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Title" />
            </div>
          </div>
        ))}
      </div>

      <MediaLibraryModal
        isOpen={mediaOpen}
        onClose={() => { setMediaOpen(false); setMediaTarget(null); }}
        onSelect={(url) => {
          if (mediaTarget !== null) setProp((p) => { p.panels[mediaTarget].src = url; });
          setMediaOpen(false);
          setMediaTarget(null);
        }}
      />
    </div>
  );
};

ImagePanels.craft = {
  displayName: 'Image Panels',
  props: { panels: [{ src: 'https://placehold.co/400x600/3b82f6/ffffff?text=Panel+1', title: 'Panel 1' }, { src: 'https://placehold.co/400x600/8b5cf6/ffffff?text=Panel+2', title: 'Panel 2' }, { src: 'https://placehold.co/400x600/ec4899/ffffff?text=Panel+3', title: 'Panel 3' }, { src: 'https://placehold.co/400x600/f59e0b/ffffff?text=Panel+4', title: 'Panel 4' }], height: '400px', gap: '4px', textColor: '#ffffff', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
