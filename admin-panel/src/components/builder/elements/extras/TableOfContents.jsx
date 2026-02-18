import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const TableOfContents = ({
  items = [
    { text: 'Introduction', level: 1, id: 'intro' },
    { text: 'Getting Started', level: 1, id: 'getting-started' },
    { text: 'Installation', level: 2, id: 'installation' },
    { text: 'Configuration', level: 2, id: 'configuration' },
    { text: 'Advanced Usage', level: 1, id: 'advanced' },
    { text: 'Conclusion', level: 1, id: 'conclusion' },
  ],
  title = 'Table of Contents',
  backgroundColor = '#f9fafb',
  borderColor = '#e5e7eb',
  textColor = '#374151',
  activeColor = '#3b82f6',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));

  return (
    <div ref={(ref) => connect(drag(ref))} className={`toc-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ backgroundColor, border: `1px solid ${borderColor}`, borderRadius, padding: '20px', ...style }}>
      {title && <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>{title}</h4>}
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, i) => (
            <li key={i}>
              <a href={`#${item.id}`} onClick={(e) => e.preventDefault()}
                style={{ display: 'block', padding: '6px 0', paddingLeft: `${(item.level - 1) * 16}px`, fontSize: item.level === 1 ? '14px' : '13px', fontWeight: item.level === 1 ? 500 : 400, color: textColor, textDecoration: 'none', borderLeft: `2px solid transparent`, transition: 'color 0.2s' }}>
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export const TableOfContentsSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { items = [], title = '', backgroundColor = '#f9fafb', borderColor = '#e5e7eb', textColor = '#374151', activeColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Settings</h4>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-700">Items</h4><button onClick={() => setProp((p) => { p.items = [...(p.items||[]), { text: 'New Section', level: 1, id: 'new-section' }]; })} className="text-xs text-blue-600">+ Add</button></div>
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="flex gap-2 items-center">
              <select value={item.level} onChange={(e) => setProp((p) => { p.items[i].level = Number(e.target.value); })} className="w-14 px-1 py-1 border border-gray-300 rounded text-xs"><option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option></select>
              <input type="text" value={item.text} onChange={(e) => setProp((p) => { p.items[i].text = e.target.value; })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
              <button onClick={() => setProp((p) => { p.items = p.items.filter((_,idx) => idx !== i); })} className="text-xs text-red-500">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

TableOfContents.craft = {
  displayName: 'Table of Contents',
  props: { items: [{ text: 'Introduction', level: 1, id: 'intro' }, { text: 'Getting Started', level: 1, id: 'getting-started' }, { text: 'Installation', level: 2, id: 'installation' }, { text: 'Configuration', level: 2, id: 'configuration' }, { text: 'Advanced Usage', level: 1, id: 'advanced' }, { text: 'Conclusion', level: 1, id: 'conclusion' }], title: 'Table of Contents', backgroundColor: '#f9fafb', borderColor: '#e5e7eb', textColor: '#374151', activeColor: '#3b82f6', borderRadius: '8px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
