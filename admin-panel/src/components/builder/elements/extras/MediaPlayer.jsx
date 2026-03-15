import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const MediaPlayer = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  src = 'https://www.w3schools.com/html/mov_bbb.mp4',
  type = 'video',
  poster = '',
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  width = '100%',
  height = 'auto',
  borderRadius = '8px',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`media-player ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ borderRadius, overflow: 'hidden', ...style }}>
      {type === 'video' ? (
        <video src={src} poster={poster} controls={controls} autoPlay={autoplay} loop={loop} muted={muted}
          style={{ width, height, display: 'block' }} />
      ) : (
        <audio src={src} controls={controls} autoPlay={autoplay} loop={loop} muted={muted}
          style={{ width, display: 'block' }} />
      )}
    </div>
  );
};

export const MediaPlayerSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { src = '', type = 'video', poster = '', autoplay = false, controls = true, loop = false, muted = false, borderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Media</h4>
        <div><label className="block text-sm font-medium text-gray-700">Type</label><select value={type} onChange={(e) => setProp((p) => { p.type = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="video">Video</option><option value="audio">Audio</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700">Source URL</label><input type="text" value={src} onChange={(e) => setProp((p) => { p.src = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        {type === 'video' && <div><label className="block text-sm font-medium text-gray-700">Poster URL</label><input type="text" value={poster} onChange={(e) => setProp((p) => { p.poster = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Options</h4>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={controls} onChange={(e) => setProp((p) => { p.controls = e.target.checked; })} />Controls</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoplay} onChange={(e) => setProp((p) => { p.autoplay = e.target.checked; })} />Autoplay</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={loop} onChange={(e) => setProp((p) => { p.loop = e.target.checked; })} />Loop</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={muted} onChange={(e) => setProp((p) => { p.muted = e.target.checked; })} />Muted</label>
      </div>
      <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
    </div>
  );
};

MediaPlayer.craft = {
  displayName: 'Media Player',
  props: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', type: 'video', poster: '', autoplay: false, controls: true, loop: false, muted: false, width: '100%', height: 'auto', borderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
