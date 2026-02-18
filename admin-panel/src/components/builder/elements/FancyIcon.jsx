import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const FancyIcon = ({
  icon = '★',
  size = '48px',
  color = '#3b82f6',
  backgroundColor = 'transparent',
  borderColor = 'transparent',
  borderWidth = '0px',
  borderRadius = '50%',
  padding = '12px',
  className = '',
  style = {},
}) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`fancy-icon-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        color,
        backgroundColor,
        border: `${borderWidth} solid ${borderColor}`,
        borderRadius,
        padding,
        lineHeight: 1,
        ...style,
      }}
    >
      {icon}
    </div>
  );
};

export const FancyIconSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { icon = '★', size = '48px', color = '#3b82f6', backgroundColor = 'transparent', borderColor = 'transparent', borderWidth = '0px', borderRadius = '50%', padding = '12px' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Icon</h4>
        <div><label className="block text-sm font-medium text-gray-700">Icon (emoji/text)</label><input type="text" value={icon} onChange={(e) => setProp((p) => { p.icon = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Size</label><input type="text" value={size} onChange={(e) => setProp((p) => { p.size = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Color</label><input type="color" value={color} onChange={(e) => setProp((p) => { p.color = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Background</label><input type="color" value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Padding</label><input type="text" value={padding} onChange={(e) => setProp((p) => { p.padding = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Border Width</label><input type="text" value={borderWidth} onChange={(e) => setProp((p) => { p.borderWidth = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Border Color</label><input type="color" value={borderColor === 'transparent' ? '#000000' : borderColor} onChange={(e) => setProp((p) => { p.borderColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

FancyIcon.craft = {
  displayName: 'Fancy Icon',
  props: { icon: '★', size: '48px', color: '#3b82f6', backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: '0px', borderRadius: '50%', padding: '12px', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
