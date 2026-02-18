import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const UltimateVideo = ({
  src = '',
  type = 'youtube',
  youtubeId = 'dQw4w9WgXcQ',
  vimeoId = '',
  poster = 'https://placehold.co/640x360/1f2937/e5e7eb?text=Video',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  width = '100%',
  aspectRatio = '16/9',
  borderRadius = '8px',
  overlayColor = 'rgba(0,0,0,0.3)',
  showPlayButton = true,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  const renderVideo = () => {
    if (type === 'youtube' && youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius }}
          allow="autoplay; fullscreen"
          title="YouTube Video"
        />
      );
    }
    if (type === 'vimeo' && vimeoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&muted=${muted ? 1 : 0}`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius }}
          allow="autoplay; fullscreen"
          title="Vimeo Video"
        />
      );
    }
    if (type === 'self' && src) {
      return (
        <video src={src} poster={poster} autoPlay={autoplay} loop={loop} muted={muted} controls={controls}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
      );
    }
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius, position: 'relative' }}>
        {poster && <img src={poster} alt="Video poster" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius, position: 'absolute', top: 0, left: 0 }} />}
        {showPlayButton && (
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: overlayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <div style={{ width: 0, height: 0, borderLeft: '20px solid #fff', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: '4px' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ width, aspectRatio, overflow: 'hidden', borderRadius, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {renderVideo()}
    </div>
  );
};

export const UltimateVideoSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Video Type</label>
      <select value={props.type || 'youtube'} onChange={(e) => setProp((p) => { p.type = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <option value="youtube">YouTube</option>
        <option value="vimeo">Vimeo</option>
        <option value="self">Self Hosted</option>
      </select>
      {(props.type === 'youtube' || !props.type) && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>YouTube Video ID</label>
          <input type="text" value={props.youtubeId || ''} onChange={(e) => setProp((p) => { p.youtubeId = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      )}
      {props.type === 'vimeo' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Vimeo Video ID</label>
          <input type="text" value={props.vimeoId || ''} onChange={(e) => setProp((p) => { p.vimeoId = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      )}
      {props.type === 'self' && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Video URL</label>
          <input type="text" value={props.src || ''} onChange={(e) => setProp((p) => { p.src = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      )}
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Poster Image URL</label>
      <input type="text" value={props.poster || ''} onChange={(e) => setProp((p) => { p.poster = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Aspect Ratio</label>
      <select value={props.aspectRatio || '16/9'} onChange={(e) => setProp((p) => { p.aspectRatio = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        {['16/9', '4/3', '1/1', '21/9'].map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Border Radius</label>
      <input type="text" value={props.borderRadius || '8px'} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[{ key: 'autoplay', label: 'Autoplay' }, { key: 'loop', label: 'Loop' }, { key: 'muted', label: 'Muted' }, { key: 'controls', label: 'Show Controls' }].map(({ key, label }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input type="checkbox" checked={!!props[key]} onChange={(e) => setProp((p) => { p[key] = e.target.checked; })} /> {label}
          </label>
        ))}
      </div>
    </div>
  );
};

UltimateVideo.craft = {
  displayName: 'Ultimate Video',
  props: { src: '', type: 'youtube', youtubeId: 'dQw4w9WgXcQ', vimeoId: '', poster: 'https://placehold.co/640x360/1f2937/e5e7eb?text=Video', autoplay: false, loop: false, muted: false, controls: true, width: '100%', aspectRatio: '16/9', borderRadius: '8px', overlayColor: 'rgba(0,0,0,0.3)', showPlayButton: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: UltimateVideoSettings },
};
