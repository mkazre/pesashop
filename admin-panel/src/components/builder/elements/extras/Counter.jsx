import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const Counter = ({
  endValue = 1000,
  startValue = 0,
  duration = 2000,
  prefix = '',
  suffix = '+',
  title = 'Happy Customers',
  numberColor = '#111827',
  titleColor = '#6b7280',
  numberSize = '42px',
  titleSize = '14px',
  textAlign = 'center',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [count, setCount] = useState(startValue);
  const ref = useRef(null);

  useEffect(() => {
    let start = startValue;
    const step = (endValue - startValue) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= endValue) { setCount(endValue); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [endValue, startValue, duration]);

  return (
    <div ref={(r) => connect(drag(r))} className={`counter-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ textAlign, ...style }}>
      <div style={{ fontSize: numberSize, fontWeight: 700, color: numberColor, lineHeight: 1.2 }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      {title && <div style={{ fontSize: titleSize, color: titleColor, marginTop: '4px' }}>{title}</div>}
    </div>
  );
};

export const CounterSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { endValue = 1000, startValue = 0, duration = 2000, prefix = '', suffix = '+', title = '', numberColor = '#111827', titleColor = '#6b7280', numberSize = '42px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Counter</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Start</label><input type="number" value={startValue} onChange={(e) => setProp((p) => { p.startValue = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">End</label><input type="number" value={endValue} onChange={(e) => setProp((p) => { p.endValue = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Duration (ms)</label><input type="number" value={duration} onChange={(e) => setProp((p) => { p.duration = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Prefix</label><input type="text" value={prefix} onChange={(e) => setProp((p) => { p.prefix = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Suffix</label><input type="text" value={suffix} onChange={(e) => setProp((p) => { p.suffix = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Number Color</label><input type="color" value={numberColor} onChange={(e) => setProp((p) => { p.numberColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Title Color</label><input type="color" value={titleColor} onChange={(e) => setProp((p) => { p.titleColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Number Size</label><input type="text" value={numberSize} onChange={(e) => setProp((p) => { p.numberSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

Counter.craft = {
  displayName: 'Counter',
  props: { endValue: 1000, startValue: 0, duration: 2000, prefix: '', suffix: '+', title: 'Happy Customers', numberColor: '#111827', titleColor: '#6b7280', numberSize: '42px', titleSize: '14px', textAlign: 'center', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
