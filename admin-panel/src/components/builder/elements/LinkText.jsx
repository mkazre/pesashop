import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const LinkText = ({
  text = 'Link Text',
  url = '#',
  target = '_self',
  color = '#3b82f6',
  fontSize = '14px',
  fontWeight = 'normal',
  textDecoration = 'underline',
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
    <a
      ref={(ref) => connect(drag(ref))}
      href={url}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`link-text-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ color, fontSize, fontWeight, textDecoration, cursor: 'pointer', ...style }}
      onClick={(e) => e.preventDefault()}
    >
      {text}
    </a>
  );
};

export const LinkTextSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { text = '', url = '', target = '_self', color = '#3b82f6', fontSize = '14px', textDecoration = 'underline' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text</label><input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">URL</label><input type="text" value={url} onChange={(e) => setProp((p) => { p.url = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="https://" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Target</label><select value={target} onChange={(e) => setProp((p) => { p.target = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="_self">Same Window</option><option value="_blank">New Window</option></select></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Color</label><input type="color" value={color} onChange={(e) => setProp((p) => { p.color = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Text Decoration</label><select value={textDecoration} onChange={(e) => setProp((p) => { p.textDecoration = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="underline">Underline</option><option value="none">None</option><option value="line-through">Strikethrough</option></select></div>
      </div>
    </div>
  );
};

LinkText.craft = {
  displayName: 'Link Text',
  props: { text: 'Link Text', url: '#', target: '_self', color: '#3b82f6', fontSize: '14px', fontWeight: 'normal', textDecoration: 'underline', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
