import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Span = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  content = 'Span text',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  return (
    <span
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
        display: 'inline-block',
        minWidth: '20px',
      }}
    >
      {content}
    </span>
  );
};

export const SpanSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Content</label>
      <input
        type="text"
        value={props.content || ''}
        onChange={(e) => setProp((p) => { p.content = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
      />
    </div>
  );
};

Span.craft = {
  displayName: 'Span',
  props: { content: 'Span text', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: SpanSettings },
};
