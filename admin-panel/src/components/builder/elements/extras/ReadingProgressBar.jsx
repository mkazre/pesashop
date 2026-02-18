import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ReadingProgressBar = ({
  color = '#3b82f6',
  height = '4px',
  position = 'top',
  backgroundColor = 'transparent',
  progress = 45,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`reading-progress ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ width: '100%', height, backgroundColor, ...style }}>
      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s ease', borderRadius: position === 'top' ? '0 0 2px 0' : '0 2px 0 0' }} />
    </div>
  );
};

export const ReadingProgressBarSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { color = '#3b82f6', height = '4px', progress = 45, backgroundColor = 'transparent' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Progress</h4>
        <div><label className="block text-sm font-medium text-gray-700">Progress %</label><input type="range" min={0} max={100} value={progress} onChange={(e) => setProp((p) => { p.progress = Number(e.target.value); })} className="w-full" /><span className="text-xs text-gray-500">{progress}%</span></div>
        <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Bar Color</label><input type="color" value={color} onChange={(e) => setProp((p) => { p.color = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Track Color</label><input type="color" value={backgroundColor === 'transparent' ? '#e5e7eb' : backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

ReadingProgressBar.craft = {
  displayName: 'Reading Progress Bar',
  props: { color: '#3b82f6', height: '4px', position: 'top', backgroundColor: 'transparent', progress: 45, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
