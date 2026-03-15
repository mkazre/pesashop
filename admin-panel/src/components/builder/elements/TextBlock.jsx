import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const TextBlock = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  content = '<p>This is a text block. You can add multiple paragraphs of content here.</p>',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    id: node.id,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
        minHeight: '20px',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const TextBlockSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Content (HTML)</label>
      <textarea
        value={props.content || ''}
        onChange={(e) => setProp((p) => { p.content = e.target.value; })}
        rows={6}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
      />
    </div>
  );
};

TextBlock.craft = {
  displayName: 'Text Block',
  props: { content: '<p>This is a text block. You can add multiple paragraphs of content here.</p>', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: TextBlockSettings },
};
