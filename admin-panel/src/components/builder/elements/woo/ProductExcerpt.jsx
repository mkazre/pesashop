import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ProductExcerpt = ({
  excerpt = 'A brief summary of this amazing product. Perfect for quick browsing and comparison shopping.',
  fontSize = '14px',
  textColor = '#6b7280',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <p ref={(ref) => connect(drag(ref))} className={className}
      style={{ fontSize, color: textColor, lineHeight: 1.6, margin: 0, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {excerpt}
    </p>
  );
};

export const ProductExcerptSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Excerpt</label>
      <textarea value={props.excerpt || ''} onChange={(e) => setProp((p) => { p.excerpt = e.target.value; })} rows={3}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} />
    </div>
  );
};

ProductExcerpt.craft = {
  displayName: 'Product Excerpt',
  props: { excerpt: 'A brief summary of this amazing product.', fontSize: '14px', textColor: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ProductExcerptSettings },
};
