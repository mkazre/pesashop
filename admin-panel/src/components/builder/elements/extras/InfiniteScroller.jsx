import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const InfiniteScroller = ({
  items = ['Item 1 ★', 'Item 2 ★', 'Item 3 ★', 'Item 4 ★', 'Item 5 ★'],
  speed = 30,
  direction = 'left',
  gap = '48px',
  fontSize = '16px',
  color = '#374151',
  pauseOnHover = true,
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  const content = items.join(`  •  `);

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <div style={{ display: 'inline-block', fontSize, color, animation: `scroll-${direction} ${speed}s linear infinite`, paddingRight: gap }}>
        {content}  •  {content}
      </div>
      <style>{`@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } @keyframes scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }`}</style>
    </div>
  );
};

export const InfiniteScrollerSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Items (one per line)</label>
      <textarea value={(props.items || []).join('\n')} onChange={(e) => setProp((p) => { p.items = e.target.value.split('\n'); })} rows={4}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', resize: 'vertical', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Speed (seconds)</label>
      <input type="number" value={props.speed || 30} onChange={(e) => setProp((p) => { p.speed = parseInt(e.target.value) || 30; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Direction</label>
      <select value={props.direction || 'left'} onChange={(e) => setProp((p) => { p.direction = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>
    </div>
  );
};

InfiniteScroller.craft = {
  displayName: 'Infinite Scroller',
  props: { items: ['Item 1 ★', 'Item 2 ★', 'Item 3 ★', 'Item 4 ★', 'Item 5 ★'], speed: 30, direction: 'left', gap: '48px', fontSize: '16px', color: '#374141', pauseOnHover: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: InfiniteScrollerSettings },
};
