import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

const MASKS = {
  circle: '50%',
  rounded: '20px',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
};

export const ImageMask = ({
  src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Masked+Image',
  alt = 'Masked image',
  maskShape = 'circle',
  width = '250px',
  height = '250px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const isClipPath = ['diamond', 'hexagon', 'triangle', 'star'].includes(maskShape);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`image-mask ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ width, height, overflow: 'hidden', ...style }}>
      <img src={src} alt={alt} style={{
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        borderRadius: !isClipPath ? MASKS[maskShape] : undefined,
        clipPath: isClipPath ? MASKS[maskShape] : undefined,
      }} />
    </div>
  );
};

export const ImageMaskSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { src = '', alt = '', maskShape = 'circle', width = '250px', height = '250px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Image</h4>
        <div><label className="block text-sm font-medium text-gray-700">Image URL</label><input type="text" value={src} onChange={(e) => setProp((p) => { p.src = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Alt Text</label><input type="text" value={alt} onChange={(e) => setProp((p) => { p.alt = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Mask</h4>
        <div><label className="block text-sm font-medium text-gray-700">Shape</label><select value={maskShape} onChange={(e) => setProp((p) => { p.maskShape = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="circle">Circle</option><option value="rounded">Rounded</option><option value="diamond">Diamond</option><option value="hexagon">Hexagon</option><option value="triangle">Triangle</option><option value="star">Star</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Width</label><input type="text" value={width} onChange={(e) => setProp((p) => { p.width = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
    </div>
  );
};

ImageMask.craft = {
  displayName: 'Image Mask',
  props: { src: 'https://placehold.co/400x400/e2e8f0/64748b?text=Masked+Image', alt: 'Masked image', maskShape: 'circle', width: '250px', height: '250px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
