import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ProductDescription = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  description = 'This premium product features high-quality materials and exceptional craftsmanship. Perfect for everyday use, it combines style with functionality to deliver an outstanding experience.',
  fontSize = '14px',
  textColor = '#374151',
  lineHeight = '1.7',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-description ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ fontSize, color: textColor, lineHeight, ...style }}>
      {description}
    </div>
  );
};

export const ProductDescriptionSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { description = '', fontSize = '14px', textColor = '#374151', lineHeight = '1.7' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Product Description</h4>
        <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea value={description} onChange={(e) => setProp((p) => { p.description = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={5} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Line Height</label><input type="text" value={lineHeight} onChange={(e) => setProp((p) => { p.lineHeight = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

ProductDescription.craft = {
  displayName: 'Product Description',
  props: { description: 'This premium product features high-quality materials and exceptional craftsmanship.', fontSize: '14px', textColor: '#374151', lineHeight: '1.7', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
