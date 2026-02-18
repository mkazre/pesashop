import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ArchiveTitle = ({
  title = 'Shop',
  tag = 'h1',
  fontSize = '32px',
  fontWeight = '700',
  color = '#111827',
  textAlign = 'left',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  const Tag = tag;
  return (
    <Tag ref={(ref) => connect(drag(ref))} className={className}
      style={{ fontSize, fontWeight, color, textAlign, margin: 0, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {title}
    </Tag>
  );
};

export const ArchiveTitleSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Title</label>
      <input type="text" value={props.title || ''} onChange={(e) => setProp((p) => { p.title = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Tag</label>
      <select value={props.tag || 'h1'} onChange={(e) => setProp((p) => { p.tag = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        {['h1','h2','h3','h4','h5','h6'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Color</label>
      <input type="color" value={props.color || '#111827'} onChange={(e) => setProp((p) => { p.color = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

ArchiveTitle.craft = {
  displayName: 'Archive Title',
  props: { title: 'Shop', tag: 'h1', fontSize: '32px', fontWeight: '700', color: '#111827', textAlign: 'left', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ArchiveTitleSettings },
};
