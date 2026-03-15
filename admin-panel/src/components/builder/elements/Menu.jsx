import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Menu = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  items = [
    { label: 'Home', url: '#' },
    { label: 'About', url: '#' },
    { label: 'Services', url: '#', children: [
      { label: 'Web Design', url: '#' },
      { label: 'Development', url: '#' },
      { label: 'SEO', url: '#' },
    ]},
    { label: 'Contact', url: '#' },
  ],
  layout = 'horizontal',
  fontSize = '14px',
  textColor = '#374151',
  hoverColor = '#3b82f6',
  backgroundColor = 'transparent',
  gap = '24px',
  className = '',
  style = {},
} = resolved;

  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const [openDropdown, setOpenDropdown] = useState(-1);

  return (
    <nav
      ref={(ref) => connect(drag(ref))}
      className={`menu-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ backgroundColor, ...style }}
    >
      <ul style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        gap,
        listStyle: 'none',
        margin: 0,
        padding: 0,
        alignItems: layout === 'vertical' ? 'stretch' : 'center',
      }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{ position: 'relative' }}
            onMouseEnter={() => item.children?.length && setOpenDropdown(i)}
            onMouseLeave={() => setOpenDropdown(-1)}
          >
            <a
              href={item.url || '#'}
              onClick={(e) => e.preventDefault()}
              style={{
                fontSize,
                color: textColor,
                textDecoration: 'none',
                fontWeight: 500,
                padding: '8px 0',
                display: 'block',
                transition: 'color 0.2s',
              }}
            >
              {item.label}
              {item.children?.length > 0 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>▾</span>}
            </a>
            {item.children?.length > 0 && openDropdown === i && (
              <ul style={{
                position: layout === 'horizontal' ? 'absolute' : 'relative',
                top: layout === 'horizontal' ? '100%' : 'auto',
                left: 0,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '180px',
                listStyle: 'none',
                margin: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}>
                {item.children.map((child, j) => (
                  <li key={j}>
                    <a
                      href={child.url || '#'}
                      onClick={(e) => e.preventDefault()}
                      style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: textColor, textDecoration: 'none' }}
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const MenuSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], layout = 'horizontal', fontSize = '14px', textColor = '#374151', hoverColor = '#3b82f6', gap = '24px' } = props;

  const addItem = () => {
    setProp((p) => { p.items = [...(p.items || []), { label: 'New Item', url: '#' }]; });
  };

  const removeItem = (index) => {
    setProp((p) => { p.items = p.items.filter((_, i) => i !== index); });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        <div><label className="block text-sm font-medium text-gray-700">Direction</label>
          <select value={layout} onChange={(e) => setProp((p) => { p.layout = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="horizontal">Horizontal</option><option value="vertical">Vertical</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Gap</label><input type="text" value={gap} onChange={(e) => setProp((p) => { p.gap = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Hover Color</label><input type="color" value={hoverColor} onChange={(e) => setProp((p) => { p.hoverColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Menu Items</h4>
          <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800">+ Add Item</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Item {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-xs text-red-500">Remove</button>
            </div>
            <input type="text" value={item.label} onChange={(e) => setProp((p) => { p.items[i].label = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Label" />
            <input type="text" value={item.url || ''} onChange={(e) => setProp((p) => { p.items[i].url = e.target.value; })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="URL" />
          </div>
        ))}
      </div>
    </div>
  );
};

Menu.craft = {
  displayName: 'Menu',
  props: {
    items: [
      { label: 'Home', url: '#' },
      { label: 'About', url: '#' },
      { label: 'Services', url: '#', children: [{ label: 'Web Design', url: '#' }, { label: 'Development', url: '#' }, { label: 'SEO', url: '#' }] },
      { label: 'Contact', url: '#' },
    ],
    layout: 'horizontal', fontSize: '14px', textColor: '#374151', hoverColor: '#3b82f6', backgroundColor: 'transparent', gap: '24px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
