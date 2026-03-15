import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Superbox = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  imageSrc = 'https://placehold.co/600x400/e2e8f0/64748b?text=Superbox+Image',
  title = 'Superbox Title',
  description = 'Hover to see the overlay effect',
  overlayColor = 'rgba(0,0,0,0.6)',
  textColor = '#ffffff',
  height = '300px',
  overlayEffect = 'fade',
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

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`superbox-element group ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', height, cursor: 'pointer', ...style }}
    >
      <img
        src={imageSrc}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, backgroundColor: overlayColor,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.3s ease', padding: '20px', textAlign: 'center',
        }}
        className="group-hover:!opacity-100"
      >
        <h3 style={{ color: textColor, fontSize: '20px', fontWeight: 600, margin: '0 0 8px 0' }}>{title}</h3>
        <p style={{ color: textColor, fontSize: '14px', margin: 0, opacity: 0.9 }}>{description}</p>
      </div>
    </div>
  );
};

export const SuperboxSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { imageSrc = '', title = '', description = '', overlayColor = 'rgba(0,0,0,0.6)', textColor = '#ffffff', height = '300px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Image URL</label><input type="text" value={imageSrc} onChange={(e) => setProp((p) => { p.imageSrc = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea value={description} onChange={(e) => setProp((p) => { p.description = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={2} /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

Superbox.craft = {
  displayName: 'Superbox',
  props: { imageSrc: 'https://placehold.co/600x400/e2e8f0/64748b?text=Superbox+Image', title: 'Superbox Title', description: 'Hover to see the overlay effect', overlayColor: 'rgba(0,0,0,0.6)', textColor: '#ffffff', height: '300px', overlayEffect: 'fade', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
