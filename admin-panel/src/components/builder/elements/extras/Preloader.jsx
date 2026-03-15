import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Preloader = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  type = 'spinner',
  size = '48px',
  color = '#3b82f6',
  thickness = '4px',
  text = 'Loading...',
  showText = true,
  textColor = '#6b7280',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  const spinnerStyle = `@keyframes spin { to { transform: rotate(360deg); } }`;
  const pulseStyle = `@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } }`;
  const dotsStyle = `@keyframes dots { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`;

  return (
    <div ref={(ref) => connect(drag(ref))} className={`preloader ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', ...style }}>
      <style>{spinnerStyle}{pulseStyle}{dotsStyle}</style>
      {type === 'spinner' && (
        <div style={{ width: size, height: size, border: `${thickness} solid #e5e7eb`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      )}
      {type === 'pulse' && (
        <div style={{ width: size, height: size, backgroundColor: color, borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      )}
      {type === 'dots' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: `calc(${size} / 3)`, height: `calc(${size} / 3)`, backgroundColor: color, borderRadius: '50%', animation: `dots 1.4s ease-in-out ${i * 0.16}s infinite` }} />
          ))}
        </div>
      )}
      {showText && <span style={{ fontSize: '13px', color: textColor }}>{text}</span>}
    </div>
  );
};

export const PreloaderSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { type = 'spinner', size = '48px', color = '#3b82f6', thickness = '4px', text = '', showText = true, textColor = '#6b7280' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Preloader</h4>
        <div><label className="block text-sm font-medium text-gray-700">Type</label><select value={type} onChange={(e) => setProp((p) => { p.type = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="spinner">Spinner</option><option value="pulse">Pulse</option><option value="dots">Dots</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Size</label><input type="text" value={size} onChange={(e) => setProp((p) => { p.size = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Color</label><input type="color" value={color} onChange={(e) => setProp((p) => { p.color = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showText} onChange={(e) => setProp((p) => { p.showText = e.target.checked; })} />Show Text</label>
        {showText && <div><label className="block text-sm font-medium text-gray-700">Text</label><input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>}
      </div>
    </div>
  );
};

Preloader.craft = {
  displayName: 'Preloader',
  props: { type: 'spinner', size: '48px', color: '#3b82f6', thickness: '4px', text: 'Loading...', showText: true, textColor: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
