import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';

export const ArchiveCategories = ({
  categories = [
    { name: 'Electronics', count: 24, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Elec' },
    { name: 'Clothing', count: 18, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Cloth' },
    { name: 'Home & Garden', count: 32, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Home' },
    { name: 'Sports', count: 15, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Sport' },
  ],
  columns = 4,
  gap = '16px',
  showCount = true,
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`, gap: effectiveGap, ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      {categories.map((cat, i) => (
        <a key={i} href="#" style={{ textDecoration: 'none', color: 'inherit', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'block' }}>
          <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{cat.name}</div>
            {showCount && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{cat.count} products</div>}
          </div>
        </a>
      ))}
    </div>
  );
};

export const ArchiveCategoriesSettings = ({ nodeId }) => {
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
      <input type="number" min={1} max={6} value={getRP('columns', 4)} onChange={(e) => updateRP('columns', parseInt(e.target.value) || 4)}
        style={{ width: '100%', padding: '8px', border: `1px solid ${hasRP('columns') ? '#f59e0b' : '#d1d5db'}`, borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={props.showCount !== false} onChange={(e) => setProp((p) => { p.showCount = e.target.checked; })} /> Show Product Count
      </label>
    </div>
  );
};

ArchiveCategories.craft = {
  displayName: 'Archive Categories',
  props: { categories: [{ name: 'Electronics', count: 24, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Elec' }, { name: 'Clothing', count: 18, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Cloth' }, { name: 'Home & Garden', count: 32, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Home' }, { name: 'Sports', count: 15, image: 'https://placehold.co/200x200/e2e8f0/64748b?text=Sport' }], columns: 4, gap: '16px', responsiveProps: {}, showCount: true, className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: ArchiveCategoriesSettings },
};
