import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const HoverAnimatedButton = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  text = 'Hover Me',
  url = '#',
  hoverEffect = 'slide-right',
  backgroundColor = '#3b82f6',
  hoverColor = '#1d4ed8',
  textColor = '#ffffff',
  fontSize = '14px',
  fontWeight = '600',
  padding = '12px 32px',
  borderRadius = '8px',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  const effectStyles = {
    'slide-right': `
      .hover-btn-slide-right { position: relative; overflow: hidden; z-index: 1; }
      .hover-btn-slide-right::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: var(--hover-color); transition: left 0.3s ease; z-index: -1; }
      .hover-btn-slide-right:hover::before { left: 0; }
    `,
    'scale': `.hover-btn-scale:hover { transform: scale(1.05); }`,
    'shadow': `.hover-btn-shadow:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.2); transform: translateY(-2px); }`,
  };

  return (
    <div ref={(ref) => connect(drag(ref))} className={`hover-animated-btn ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <style>{effectStyles[hoverEffect] || ''}</style>
      <a href={url} onClick={(e) => e.preventDefault()}
        className={`hover-btn-${hoverEffect}`}
        style={{
          '--hover-color': hoverColor,
          display: 'inline-block', padding, backgroundColor, color: textColor, fontSize, fontWeight,
          borderRadius, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
        }}>
        {text}
      </a>
    </div>
  );
};

export const HoverAnimatedButtonSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { text = '', url = '', hoverEffect = 'slide-right', backgroundColor = '#3b82f6', hoverColor = '#1d4ed8', textColor = '#ffffff', fontSize = '14px', padding = '12px 32px', borderRadius = '8px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text</label><input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">URL</label><input type="text" value={url} onChange={(e) => setProp((p) => { p.url = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Hover Effect</label><select value={hoverEffect} onChange={(e) => setProp((p) => { p.hoverEffect = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="slide-right">Slide Right</option><option value="scale">Scale</option><option value="shadow">Shadow Lift</option></select></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Hover Color</label><input type="color" value={hoverColor} onChange={(e) => setProp((p) => { p.hoverColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Padding</label><input type="text" value={padding} onChange={(e) => setProp((p) => { p.padding = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
    </div>
  );
};

HoverAnimatedButton.craft = {
  displayName: 'Hover Animated Button',
  props: { text: 'Hover Me', url: '#', hoverEffect: 'slide-right', backgroundColor: '#3b82f6', hoverColor: '#1d4ed8', textColor: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 32px', borderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
