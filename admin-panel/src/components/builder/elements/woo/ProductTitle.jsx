import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useRepeaterItem } from '@/components/builder/utils/RepeaterContext';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ProductTitle = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  title = 'Product Name',
  tag = 'h1',
  fontSize = '28px',
  fontWeight = '700',
  textColor = '#111827',
  textAlign = 'left',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const repeaterItem = useRepeaterItem();
  const Tag = tag;
  const displayTitle = repeaterItem?.name || title;

  return (
    <Tag ref={(ref) => connect(drag(ref))} className={`product-title ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ fontSize, fontWeight, color: textColor, textAlign, margin: 0, ...style }}>
      {displayTitle}
    </Tag>
  );
};

export const ProductTitleSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { title = '', tag = 'h1', fontSize = '28px', fontWeight = '700', textColor = '#111827', textAlign = 'left' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Product Title</h4>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Tag</label><select value={tag} onChange={(e) => setProp((p) => { p.tag = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
      </div>
    </div>
  );
};

ProductTitle.craft = {
  displayName: 'Product Title',
  props: { title: 'Product Name', tag: 'h1', fontSize: '28px', fontWeight: '700', textColor: '#111827', textAlign: 'left', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
