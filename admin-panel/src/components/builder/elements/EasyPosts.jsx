import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';

export const EasyPosts = ({
  layout = 'grid',
  columns = 3,
  gap = '20px',
  showImage = true,
  showTitle = true,
  showExcerpt = true,
  showDate = true,
  showAuthor = false,
  excerptLength = 120,
  posts = [
    { title: 'Blog Post Title One', excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.', date: 'Jan 15, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+1' },
    { title: 'Blog Post Title Two', excerpt: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.', date: 'Jan 12, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+2' },
    { title: 'Blog Post Title Three', excerpt: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.', date: 'Jan 10, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+3' },
  ],
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
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
        display: layout === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: layout === 'grid' ? `repeat(${effectiveColumns}, 1fr)` : undefined,
        flexDirection: layout === 'list' ? 'column' : undefined,
        gap: effectiveGap,
        ...style,
        outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none',
        cursor: 'move',
      }}
    >
      {posts.map((post, i) => (
        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          {showImage && post.image && <img src={post.image} alt={post.title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />}
          <div style={{ padding: '16px' }}>
            {showTitle && <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{post.title}</h3>}
            {(showDate || showAuthor) && (
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                {showDate && post.date}{showDate && showAuthor && ' · '}{showAuthor && post.author}
              </div>
            )}
            {showExcerpt && <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{post.excerpt?.slice(0, excerptLength)}{post.excerpt?.length > excerptLength ? '...' : ''}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export const EasyPostsSettings = ({ nodeId }) => {
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
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Layout</label>
      <select value={props.layout || 'grid'} onChange={(e) => setProp((p) => { p.layout = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
        <option value="grid">Grid</option>
        <option value="list">List</option>
      </select>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Columns{hasRP('columns') && <button onClick={() => clearRP('columns')} style={{ marginLeft: 4, fontSize: 9, color: '#d97706', cursor: 'pointer', border: 'none', background: 'none' }}>✕</button>}</label>
      <input type="number" min={1} max={6} value={getRP('columns', 3)} onChange={(e) => updateRP('columns', parseInt(e.target.value) || 3)}
        style={{ width: '100%', padding: '8px', border: `1px solid ${hasRP('columns') ? '#f59e0b' : '#d1d5db'}`, borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      {[{ key: 'showImage', label: 'Show Image' }, { key: 'showTitle', label: 'Show Title' }, { key: 'showExcerpt', label: 'Show Excerpt' }, { key: 'showDate', label: 'Show Date' }, { key: 'showAuthor', label: 'Show Author' }].map(({ key, label }) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
          <input type="checkbox" checked={props[key] !== false} onChange={(e) => setProp((p) => { p[key] = e.target.checked; })} />
          {label}
        </label>
      ))}
    </div>
  );
};

EasyPosts.craft = {
  displayName: 'Easy Posts',
  props: {
    layout: 'grid', columns: 3, gap: '20px', responsiveProps: {}, showImage: true, showTitle: true, showExcerpt: true, showDate: true, showAuthor: false, excerptLength: 120,
    posts: [
      { title: 'Blog Post Title One', excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', date: 'Jan 15, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+1' },
      { title: 'Blog Post Title Two', excerpt: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.', date: 'Jan 12, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+2' },
      { title: 'Blog Post Title Three', excerpt: 'Duis aute irure dolor in reprehenderit in voluptate velit.', date: 'Jan 10, 2024', author: 'Admin', image: 'https://placehold.co/400x250/e2e8f0/64748b?text=Post+3' },
    ],
    className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
  related: { settings: EasyPostsSettings },
};
