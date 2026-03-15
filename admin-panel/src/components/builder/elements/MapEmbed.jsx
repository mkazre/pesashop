import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const MapEmbed = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  address = 'New York, NY',
  zoom = 14,
  height = '400px',
  mapType = 'roadmap',
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

  const encodedAddress = encodeURIComponent(address);
  const src = `https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&t=${mapType === 'satellite' ? 'k' : 'm'}&output=embed`;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`map-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ height, overflow: 'hidden', borderRadius: '8px', ...style }}
    >
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Map"
      />
    </div>
  );
};

export const MapEmbedSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { address = '', zoom = 14, height = '400px', mapType = 'roadmap' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Map</h4>
        <div><label className="block text-sm font-medium text-gray-700">Address</label><input type="text" value={address} onChange={(e) => setProp((p) => { p.address = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Enter address or location" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Zoom (1-20)</label><input type="number" min={1} max={20} value={zoom} onChange={(e) => setProp((p) => { p.zoom = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Height</label><input type="text" value={height} onChange={(e) => setProp((p) => { p.height = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Map Type</label><select value={mapType} onChange={(e) => setProp((p) => { p.mapType = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="roadmap">Roadmap</option><option value="satellite">Satellite</option></select></div>
      </div>
    </div>
  );
};

MapEmbed.craft = {
  displayName: 'Map',
  props: { address: 'New York, NY', zoom: 14, height: '400px', mapType: 'roadmap', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
