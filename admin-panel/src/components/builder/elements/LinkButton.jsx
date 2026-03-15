import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const LinkButton = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  text = 'Click Here',
  url = '#',
  target = '_self',
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  borderRadius = '6px',
  padding = '10px 24px',
  fontSize = '14px',
  fontWeight = '500',
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

  return (
    <a
      ref={(ref) => connect(drag(ref))}
      href={url}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={`link-button-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        display: 'inline-block',
        backgroundColor,
        color: textColor,
        borderRadius,
        padding,
        fontSize,
        fontWeight,
        textDecoration: 'none',
        textAlign: 'center',
        cursor: 'pointer',
        border: 'none',
        ...style,
      }}
      onClick={(e) => e.preventDefault()}
    >
      {text}
    </a>
  );
};

export const LinkButtonSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const { text = '', url = '', target = '_self', backgroundColor = '#3b82f6', textColor = '#ffffff', borderRadius = '6px', padding = '10px 24px', fontSize = '14px', fontWeight = '500' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Button Text</label>
          <input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">URL</label>
          <input type="text" value={url} onChange={(e) => setProp((p) => { p.url = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="https://" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Target</label>
          <select value={target} onChange={(e) => setProp((p) => { p.target = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="_self">Same Window</option>
            <option value="_blank">New Window</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Background</label>
            <input type="color" value={backgroundColor} onChange={(e) => setProp((p) => { p.backgroundColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Text Color</label>
            <input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Font Size</label>
            <input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Border Radius</label>
            <input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Padding</label>
          <input type="text" value={padding} onChange={(e) => setProp((p) => { p.padding = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Font Weight</label>
          <select value={fontWeight} onChange={(e) => setProp((p) => { p.fontWeight = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
          </select>
        </div>
      </div>
    </div>
  );
};

LinkButton.craft = {
  displayName: 'Link Button',
  props: { text: 'Click Here', url: '#', target: '_self', backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', fontWeight: '500', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
