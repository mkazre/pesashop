import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const AdjacentPosts = ({
  prevLabel = '← Previous Post',
  nextLabel = 'Next Post →',
  prevTitle = 'How to Get Started with Web Design',
  nextTitle = 'Advanced CSS Techniques for 2024',
  showThumbnails = false,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '16px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{prevLabel}</div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>{prevTitle}</div>
      </div>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{nextLabel}</div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>{nextTitle}</div>
      </div>
    </div>
  );
};

export const AdjacentPostsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'prevLabel', label: 'Previous Label' }, { key: 'nextLabel', label: 'Next Label' }, { key: 'prevTitle', label: 'Previous Title' }, { key: 'nextTitle', label: 'Next Title' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="text" value={props[key] || ''} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ))}
    </div>
  );
};

AdjacentPosts.craft = {
  displayName: 'Adjacent Posts',
  props: { prevLabel: '← Previous Post', nextLabel: 'Next Post →', prevTitle: 'How to Get Started with Web Design', nextTitle: 'Advanced CSS Techniques for 2024', showThumbnails: false, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: AdjacentPostsSettings },
};
