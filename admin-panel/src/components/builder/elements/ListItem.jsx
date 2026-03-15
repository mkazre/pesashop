import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ListItem = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  items = ['List item one', 'List item two', 'List item three'],
  listType = 'ul',
  icon = '',
  iconColor = '#3b82f6',
  gap = '8px',
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

  const Tag = listType === 'ol' ? 'ol' : 'ul';

  return (
    <Tag
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
        listStyle: icon ? 'none' : undefined,
        paddingLeft: icon ? '0' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span style={{ color: iconColor, flexShrink: 0 }}>{icon}</span>}
          {item}
        </li>
      ))}
    </Tag>
  );
};

export const ListItemSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Items (one per line)</label>
      <textarea
        value={(props.items || []).join('\n')}
        onChange={(e) => setProp((p) => { p.items = e.target.value.split('\n'); })}
        rows={5}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
      />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', marginTop: '12px' }}>List Type</label>
      <select value={props.listType || 'ul'} onChange={(e) => setProp((p) => { p.listType = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>
        <option value="ul">Unordered</option>
        <option value="ol">Ordered</option>
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', marginTop: '12px' }}>Custom Icon</label>
      <input type="text" value={props.icon || ''} onChange={(e) => setProp((p) => { p.icon = e.target.value; })}
        placeholder="e.g. ✓ or ★"
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
    </div>
  );
};

ListItem.craft = {
  displayName: 'List Item',
  props: { items: ['List item one', 'List item two', 'List item three'], listType: 'ul', icon: '', iconColor: '#3b82f6', gap: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ListItemSettings },
};
