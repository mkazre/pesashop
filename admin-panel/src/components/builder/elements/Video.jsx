import React from 'react';
import { useNode } from '@craftjs/core';
import { useEditor } from '@craftjs/core';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';

export const Video = ({
  src = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  aspectRatio = '16/9',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const embedSrc = getEmbedUrl(src, { autoplay, loop, muted });

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`video-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ aspectRatio, overflow: 'hidden', ...style }}
    >
      <iframe
        src={embedSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
};

function getEmbedUrl(url, opts) {
  if (!url) return '';
  try {
    const params = [];
    if (opts.autoplay) params.push('autoplay=1');
    if (opts.loop) params.push('loop=1');
    if (opts.muted) params.push('mute=1');

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}${params.length ? '?' + params.join('&') : ''}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}${params.length ? '?' + params.join('&') : ''}`;
    }
    return url;
  } catch {
    return url;
  }
}

export const VideoSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const {
    src = '',
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    aspectRatio = '16/9',
  } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Video Source</h4>
        <input
          type="text"
          value={src}
          onChange={(e) => setProp((p) => { p.src = e.target.value; })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="YouTube or Vimeo URL"
        />
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Aspect Ratio</h4>
        <select
          value={aspectRatio}
          onChange={(e) => setProp((p) => { p.aspectRatio = e.target.value; })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="16/9">16:9</option>
          <option value="4/3">4:3</option>
          <option value="1/1">1:1</option>
          <option value="21/9">21:9</option>
        </select>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Options</h4>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoplay} onChange={(e) => setProp((p) => { p.autoplay = e.target.checked; })} />
          Autoplay
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={loop} onChange={(e) => setProp((p) => { p.loop = e.target.checked; })} />
          Loop
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={muted} onChange={(e) => setProp((p) => { p.muted = e.target.checked; })} />
          Muted
        </label>
      </div>
    </div>
  );
};

Video.craft = {
  displayName: 'Video',
  props: {
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    autoplay: false,
    loop: false,
    muted: false,
    controls: true,
    aspectRatio: '16/9',
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
};
