import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const MegaMenu = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  items = [
    { label: 'Products', children: [{ label: 'Category 1', url: '#' }, { label: 'Category 2', url: '#' }, { label: 'Category 3', url: '#' }] },
    { label: 'Services', children: [{ label: 'Service 1', url: '#' }, { label: 'Service 2', url: '#' }] },
    { label: 'About', url: '#', children: [] },
    { label: 'Contact', url: '#', children: [] },
  ],
  backgroundColor = '#ffffff',
  dropdownBg = '#ffffff',
  textColor = '#374151',
  accentColor = '#3b82f6',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <nav ref={(ref) => connect(drag(ref))} className={className}
      style={{ backgroundColor, padding: '0 16px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0' }}>
        {items.map((item, i) => (
          <li key={i} style={{ position: 'relative' }}
            onMouseEnter={() => setOpenIndex(i)} onMouseLeave={() => setOpenIndex(-1)}>
            <a href={item.url || '#'} style={{ display: 'block', padding: '14px 18px', color: textColor, textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>{item.label}</a>
            {item.children?.length > 0 && openIndex === i && (
              <div style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: dropdownBg, border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px', minWidth: '200px', zIndex: 100 }}>
                {item.children.map((child, j) => (
                  <a key={j} href={child.url || '#'} style={{ display: 'block', padding: '8px 12px', color: textColor, textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>{child.label}</a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const MegaMenuSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'backgroundColor', label: 'Background' }, { key: 'textColor', label: 'Text Color' }, { key: 'accentColor', label: 'Accent Color' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="color" value={props[key] || '#374151'} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
};

MegaMenu.craft = {
  displayName: 'Mega Menu',
  props: { items: [{ label: 'Products', children: [{ label: 'Category 1', url: '#' }, { label: 'Category 2', url: '#' }] }, { label: 'Services', children: [{ label: 'Service 1', url: '#' }] }, { label: 'About', url: '#', children: [] }, { label: 'Contact', url: '#', children: [] }], backgroundColor: '#ffffff', dropdownBg: '#ffffff', textColor: '#374151', accentColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
  related: { settings: MegaMenuSettings },
};
