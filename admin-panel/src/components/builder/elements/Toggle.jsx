import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Toggle = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  title = 'Toggle Title',
  content = 'Toggle content goes here. Click the title to expand or collapse.',
  icon = '▸',
  openIcon = '▾',
  defaultOpen = false,
  borderColor = '#e5e7eb',
  headerBg = '#f9fafb',
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

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`toggle-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden', ...style }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', backgroundColor: headerBg, border: 'none', cursor: 'pointer',
          fontSize: '14px', fontWeight: 500, color: '#111827', textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '16px', transition: 'transform 0.2s' }}>{isOpen ? openIcon : icon}</span>
      </button>
      {isOpen && (
        <div style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', lineHeight: 1.6, borderTop: `1px solid ${borderColor}` }}>
          {content}
        </div>
      )}
    </div>
  );
};

export const ToggleSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { title = '', content = '', defaultOpen = false, borderColor = '#e5e7eb', headerBg = '#f9fafb' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Content</label><textarea value={content} onChange={(e) => setProp((p) => { p.content = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={defaultOpen} onChange={(e) => setProp((p) => { p.defaultOpen = e.target.checked; })} />Open by Default</label>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Border Color</label><input type="color" value={borderColor} onChange={(e) => setProp((p) => { p.borderColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Header BG</label><input type="color" value={headerBg} onChange={(e) => setProp((p) => { p.headerBg = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

Toggle.craft = {
  displayName: 'Toggle',
  props: { title: 'Toggle Title', content: 'Toggle content goes here. Click the title to expand or collapse.', icon: '▸', openIcon: '▾', defaultOpen: false, borderColor: '#e5e7eb', headerBg: '#f9fafb', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
