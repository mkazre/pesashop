import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ProgressBar = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  label = 'Progress',
  value = 75,
  max = 100,
  showPercentage = true,
  barColor = '#3b82f6',
  trackColor = '#e5e7eb',
  height = '12px',
  borderRadius = '9999px',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`progress-bar-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ padding: '4px 0', ...style }}
    >
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
          <span style={{ fontWeight: 500 }}>{label}</span>
          {showPercentage && <span style={{ color: '#6b7280' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ width: '100%', height, backgroundColor: trackColor, borderRadius, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
};

export const ProgressBarSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { label = '', value = 75, max = 100, showPercentage = true, barColor = '#3b82f6', trackColor = '#e5e7eb', height = '12px', borderRadius = '9999px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Label</label><input type="text" value={label} onChange={(e) => setProp((p) => { p.label = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Value</label><input type="number" value={value} onChange={(e) => setProp((p) => { p.value = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Max</label><input type="number" value={max} onChange={(e) => setProp((p) => { p.max = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPercentage} onChange={(e) => setProp((p) => { p.showPercentage = e.target.checked; })} />Show Percentage</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Bar Color</label><input type="color" value={barColor} onChange={(e) => setProp((p) => { p.barColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Track Color</label><input type="color" value={trackColor} onChange={(e) => setProp((p) => { p.trackColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
    </div>
  );
};

ProgressBar.craft = {
  displayName: 'Progress Bar',
  props: { label: 'Progress', value: 75, max: 100, showPercentage: true, barColor: '#3b82f6', trackColor: '#e5e7eb', height: '12px', borderRadius: '9999px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
