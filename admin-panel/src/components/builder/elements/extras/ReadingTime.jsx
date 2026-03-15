import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ReadingTime = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  text = '5 min read',
  icon = '📖',
  fontSize = '13px',
  color = '#6b7280',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  return (
    <span ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize, color, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {icon && <span>{icon}</span>}
      {text}
    </span>
  );
};

export const ReadingTimeSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Text</label>
      <input type="text" value={props.text || ''} onChange={(e) => setProp((p) => { p.text = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Icon</label>
      <input type="text" value={props.icon || ''} onChange={(e) => setProp((p) => { p.icon = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Color</label>
      <input type="color" value={props.color || '#6b7280'} onChange={(e) => setProp((p) => { p.color = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

ReadingTime.craft = {
  displayName: 'Reading Time',
  props: { text: '5 min read', icon: '📖', fontSize: '13px', color: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ReadingTimeSettings },
};
