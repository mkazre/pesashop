import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ProductRelated = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  title = 'Related Products',
  products = [
    { name: 'Related Product 1', price: '$29.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P1' },
    { name: 'Related Product 2', price: '$39.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P2' },
    { name: 'Related Product 3', price: '$49.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P3' },
    { name: 'Related Product 4', price: '$59.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P4' },
  ],
  columns = 4,
  gap = '16px',
  responsiveProps = {},
  className = '',
  style = {},
} = resolved;

  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`, gap: effectiveGap }}>
        {products.map((p, i) => (
          <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <img src={p.image} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>{p.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductRelatedSettings = ({ nodeId }) => {
  const { breakpoint } = useBreakpoint();
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const updateRP = (key, value) => { setProp((p) => { if (breakpoint === 'desktop') { p[key] = value; } else { if (!p.responsiveProps) p.responsiveProps = {}; if (!p.responsiveProps[breakpoint]) p.responsiveProps[breakpoint] = {}; p.responsiveProps[breakpoint][key] = value; } }); };
  const getRP = (key, fb) => { if (breakpoint === 'desktop') return props[key] ?? fb; const o = props.responsiveProps?.[breakpoint]?.[key]; return o !== undefined ? o : (props[key] ?? fb); };
  const hasRP = (key) => breakpoint !== 'desktop' && props.responsiveProps?.[breakpoint]?.[key] !== undefined;
  const clearRP = (key) => { setProp((p) => { if (p.responsiveProps?.[breakpoint]) delete p.responsiveProps[breakpoint][key]; }); };
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Title</label>
      <input type="text" value={props.title || ''} onChange={(e) => setProp((p) => { p.title = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Columns{hasRP('columns') && <button onClick={() => clearRP('columns')} style={{ marginLeft: 4, fontSize: 9, color: '#d97706', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>}</label>
      <input type="number" min={1} max={6} value={getRP('columns', 4)} onChange={(e) => updateRP('columns', parseInt(e.target.value) || 4)}
        style={{ width: '100%', padding: '8px', border: `1px solid ${hasRP('columns') ? '#f59e0b' : '#d1d5db'}`, borderRadius: '6px', fontSize: '13px' }} />
    </div>
  );
};

ProductRelated.craft = {
  displayName: 'Product Related',
  props: { title: 'Related Products', products: [{ name: 'Related Product 1', price: '$29.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P1' }, { name: 'Related Product 2', price: '$39.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P2' }, { name: 'Related Product 3', price: '$49.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P3' }, { name: 'Related Product 4', price: '$59.99', image: 'https://placehold.co/200x200/e2e8f0/64748b?text=P4' }], columns: 4, gap: '16px', responsiveProps: {}, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ProductRelatedSettings },
};
