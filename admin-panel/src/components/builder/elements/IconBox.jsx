import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const IconBox = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  icon = '⭐',
  title = 'Feature Title',
  description = 'Feature description goes here.',
  iconSize = '48px',
  iconColor = '#3b82f6',
  layout = 'top',
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

  const isHorizontal = layout === 'left' || layout === 'right';

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`icon-box-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? (layout === 'right' ? 'row-reverse' : 'row') : 'column',
        alignItems: isHorizontal ? 'flex-start' : 'center',
        gap: '12px',
        padding: '20px',
        textAlign: isHorizontal ? 'left' : 'center',
        ...style,
      }}
    >
      <div style={{ fontSize: iconSize, color: iconColor, lineHeight: 1, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{description}</p>
      </div>
    </div>
  );
};

export const IconBoxSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const { icon = '⭐', title = '', description = '', iconSize = '48px', iconColor = '#3b82f6', layout = 'top' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon (emoji or text)</label>
          <input type="text" value={icon} onChange={(e) => setProp((p) => { p.icon = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" value={title} onChange={(e) => setProp((p) => { p.title = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={description} onChange={(e) => setProp((p) => { p.description = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={3} />
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Layout</label>
          <select value={layout} onChange={(e) => setProp((p) => { p.layout = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="top">Icon Top</option>
            <option value="left">Icon Left</option>
            <option value="right">Icon Right</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon Size</label>
          <input type="text" value={iconSize} onChange={(e) => setProp((p) => { p.iconSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="48px" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon Color</label>
          <input type="color" value={iconColor} onChange={(e) => setProp((p) => { p.iconColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" />
        </div>
      </div>
    </div>
  );
};

IconBox.craft = {
  displayName: 'Icon Box',
  props: { icon: '⭐', title: 'Feature Title', description: 'Feature description goes here.', iconSize: '48px', iconColor: '#3b82f6', layout: 'top', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
