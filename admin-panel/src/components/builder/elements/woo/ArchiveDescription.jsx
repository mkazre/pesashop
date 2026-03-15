import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ArchiveDescription = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  description = 'Browse our collection of premium products. Find exactly what you need with our curated selection.',
  fontSize = '15px',
  textColor = '#6b7280',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <p ref={(ref) => connect(drag(ref))} className={className}
      style={{ fontSize, color: textColor, lineHeight: 1.6, margin: 0, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {description}
    </p>
  );
};

export const ArchiveDescriptionSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Description</label>
      <textarea value={props.description || ''} onChange={(e) => setProp((p) => { p.description = e.target.value; })} rows={3}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} />
    </div>
  );
};

ArchiveDescription.craft = {
  displayName: 'Archive Description',
  props: { description: 'Browse our collection of premium products.', fontSize: '15px', textColor: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ArchiveDescriptionSettings },
};
