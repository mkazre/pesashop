import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const DynamicList = ({
  items = [
    { title: 'Item One', description: 'Description for item one', icon: '📌' },
    { title: 'Item Two', description: 'Description for item two', icon: '📌' },
    { title: 'Item Three', description: 'Description for item three', icon: '📌' },
  ],
  layout = 'vertical',
  gap = '16px',
  showIcon = true,
  showDescription = true,
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={className}
      style={{
        display: 'flex',
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        gap,
        flexWrap: 'wrap',
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
      }}
    >
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          {showIcon && item.icon && <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>}
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
            {showDescription && item.description && <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export const DynamicListSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Layout</label>
      <select value={props.layout || 'vertical'} onChange={(e) => setProp((p) => { p.layout = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Gap</label>
      <input type="text" value={props.gap || '16px'} onChange={(e) => setProp((p) => { p.gap = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px' }}>
        <input type="checkbox" checked={props.showIcon !== false} onChange={(e) => setProp((p) => { p.showIcon = e.target.checked; })} /> Show Icons
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={props.showDescription !== false} onChange={(e) => setProp((p) => { p.showDescription = e.target.checked; })} /> Show Descriptions
      </label>
    </div>
  );
};

DynamicList.craft = {
  displayName: 'Dynamic List',
  props: {
    items: [
      { title: 'Item One', description: 'Description for item one', icon: '📌' },
      { title: 'Item Two', description: 'Description for item two', icon: '📌' },
      { title: 'Item Three', description: 'Description for item three', icon: '📌' },
    ],
    layout: 'vertical', gap: '16px', showIcon: true, showDescription: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
  related: { settings: DynamicListSettings },
};
