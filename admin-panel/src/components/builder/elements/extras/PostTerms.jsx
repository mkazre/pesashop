import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const PostTerms = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  terms = ['Technology', 'Design', 'Development'],
  taxonomy = 'Categories',
  separator = ', ',
  showLabel = true,
  labelColor = '#374151',
  termColor = '#3b82f6',
  fontSize = '14px',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ fontSize, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {showLabel && <span style={{ color: labelColor, fontWeight: 500 }}>{taxonomy}: </span>}
      {terms.map((term, i) => (
        <span key={i}>
          <a href="#" style={{ color: termColor, textDecoration: 'none' }}>{term}</a>
          {i < terms.length - 1 && separator}
        </span>
      ))}
    </div>
  );
};

export const PostTermsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Terms (comma separated)</label>
      <input type="text" value={(props.terms || []).join(', ')} onChange={(e) => setProp((p) => { p.terms = e.target.value.split(',').map(s => s.trim()); })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Taxonomy Label</label>
      <input type="text" value={props.taxonomy || ''} onChange={(e) => setProp((p) => { p.taxonomy = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Term Color</label>
      <input type="color" value={props.termColor || '#3b82f6'} onChange={(e) => setProp((p) => { p.termColor = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

PostTerms.craft = {
  displayName: 'Post Terms',
  props: { terms: ['Technology', 'Design', 'Development'], taxonomy: 'Categories', separator: ', ', showLabel: true, labelColor: '#374151', termColor: '#3b82f6', fontSize: '14px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: PostTermsSettings },
};
