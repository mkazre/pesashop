import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';

export const ArchiveProducts = ({
  title = 'All Products',
  columns = 3,
  gap = '20px',
  showPagination = true,
  products = [
    { name: 'Product 1', price: '$29.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P1' },
    { name: 'Product 2', price: '$39.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P2' },
    { name: 'Product 3', price: '$49.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P3' },
    { name: 'Product 4', price: '$59.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P4' },
    { name: 'Product 5', price: '$69.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P5' },
    { name: 'Product 6', price: '$79.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P6' },
  ],
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`, gap: effectiveGap }}>
        {products.map((p, i) => (
          <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
            <img src={p.image} alt={p.name} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>{p.price}</div>
              <button style={{ marginTop: '8px', width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
      {showPagination && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {[1, 2, 3].map((n) => (
            <button key={n} style={{ width: '36px', height: '36px', borderRadius: '6px', border: n === 1 ? 'none' : '1px solid #d1d5db', backgroundColor: n === 1 ? '#3b82f6' : '#fff', color: n === 1 ? '#fff' : '#374151', cursor: 'pointer', fontSize: '14px' }}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ArchiveProductsSettings = ({ nodeId }) => {
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
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Columns{hasRP('columns') && <button onClick={() => clearRP('columns')} style={{ marginLeft: 4, fontSize: 9, color: '#d97706', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>}</label>
      <input type="number" min={1} max={6} value={getRP('columns', 3)} onChange={(e) => updateRP('columns', parseInt(e.target.value) || 3)}
        style={{ width: '100%', padding: '8px', border: `1px solid ${hasRP('columns') ? '#f59e0b' : '#d1d5db'}`, borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={props.showPagination !== false} onChange={(e) => setProp((p) => { p.showPagination = e.target.checked; })} /> Show Pagination
      </label>
    </div>
  );
};

ArchiveProducts.craft = {
  displayName: 'Archive Products',
  props: { title: 'All Products', columns: 3, gap: '20px', responsiveProps: {}, showPagination: true, products: [{ name: 'Product 1', price: '$29.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P1' }, { name: 'Product 2', price: '$39.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P2' }, { name: 'Product 3', price: '$49.99', image: 'https://placehold.co/250x250/e2e8f0/64748b?text=P3' }], className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ArchiveProductsSettings },
};
