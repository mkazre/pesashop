import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ContentTimeline = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  items = [
    { date: '2024', title: 'Company Founded', description: 'Started with a small team of 3 people.' },
    { date: '2025', title: 'First Product Launch', description: 'Released our flagship product to market.' },
    { date: '2026', title: 'Global Expansion', description: 'Expanded operations to 10+ countries.' },
  ],
  lineColor = '#e5e7eb',
  dotColor = '#3b82f6',
  titleColor = '#111827',
  dateColor = '#3b82f6',
  textColor = '#6b7280',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`content-timeline ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', backgroundColor: lineColor }} />
        {items.map((item, i) => (
          <div key={i} style={{ position: 'relative', paddingBottom: i < items.length - 1 ? '32px' : 0 }}>
            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: dotColor, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + dotColor }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: dateColor, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.date}</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: titleColor, marginBottom: '4px' }}>{item.title}</div>
            <div style={{ fontSize: '14px', color: textColor, lineHeight: 1.5 }}>{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContentTimelineSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], dotColor = '#3b82f6', lineColor = '#e5e7eb', titleColor = '#111827', dateColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Dot Color</label><input type="color" value={dotColor} onChange={(e) => setProp((p) => { p.dotColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Line Color</label><input type="color" value={lineColor} onChange={(e) => setProp((p) => { p.lineColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Items</h4><button onClick={() => setProp((p) => { p.items = [...(p.items||[]), { date: '2026', title: 'New Event', description: 'Description here.' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Item {i+1}</span><button onClick={() => setProp((p) => { p.items = p.items.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">Remove</button></div>
            <input type="text" value={item.date} onChange={(e) => setProp((p) => { p.items[i].date = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Date" />
            <input type="text" value={item.title} onChange={(e) => setProp((p) => { p.items[i].title = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Title" />
            <textarea value={item.description} onChange={(e) => setProp((p) => { p.items[i].description = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" rows={2} placeholder="Description" />
          </div>
        ))}
      </div>
    </div>
  );
};

ContentTimeline.craft = {
  displayName: 'Content Timeline',
  props: { items: [{ date: '2024', title: 'Company Founded', description: 'Started with a small team of 3 people.' }, { date: '2025', title: 'First Product Launch', description: 'Released our flagship product to market.' }, { date: '2026', title: 'Global Expansion', description: 'Expanded operations to 10+ countries.' }], lineColor: '#e5e7eb', dotColor: '#3b82f6', titleColor: '#111827', dateColor: '#3b82f6', textColor: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
