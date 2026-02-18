import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

const SHAPES = {
  wave: 'M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,96C960,107,1056,117,1152,112C1248,107,1344,85,1392,74.7L1440,64L1440,320L0,320Z',
  triangle: 'M0,320L720,0L1440,320L1440,320L0,320Z',
  tilt: 'M0,160L1440,320L1440,320L0,320Z',
  curve: 'M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L0,320Z',
  zigzag: 'M0,288L120,256L240,288L360,256L480,288L600,256L720,288L840,256L960,288L1080,256L1200,288L1320,256L1440,288L1440,320L0,320Z',
};

export const ShapeDivider = ({
  shape = 'wave',
  color = '#3b82f6',
  height = '80px',
  flip = false,
  position = 'bottom',
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

  const path = SHAPES[shape] || SHAPES.wave;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`shape-divider-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        width: '100%',
        height,
        overflow: 'hidden',
        lineHeight: 0,
        transform: `${flip ? 'scaleX(-1)' : ''} ${position === 'top' ? 'scaleY(-1)' : ''}`.trim() || undefined,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <path d={path} fill={color} />
      </svg>
    </div>
  );
};

export const ShapeDividerSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { shape = 'wave', color = '#3b82f6', height = '80px', flip = false, position = 'bottom' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Shape</h4>
        <div><label className="block text-sm font-medium text-gray-700">Shape Type</label>
          <select value={shape} onChange={(e) => setProp((p) => { p.shape = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="wave">Wave</option><option value="triangle">Triangle</option><option value="tilt">Tilt</option><option value="curve">Curve</option><option value="zigzag">Zigzag</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Position</label>
          <select value={position} onChange={(e) => setProp((p) => { p.position = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="bottom">Bottom</option><option value="top">Top</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flip} onChange={(e) => setProp((p) => { p.flip = e.target.checked; })} />Flip Horizontal</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Color</label><input type="color" value={color} onChange={(e) => setProp((p) => { p.color = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

ShapeDivider.craft = {
  displayName: 'Shape Divider',
  props: { shape: 'wave', color: '#3b82f6', height: '80px', flip: false, position: 'bottom', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
