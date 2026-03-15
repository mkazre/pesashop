import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const HighlightedHeading = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  beforeText = 'We provide ',
  highlightText = 'amazing',
  afterText = ' solutions',
  tag = 'h2',
  highlightColor = '#fbbf24',
  highlightStyle = 'background',
  textColor = '#111827',
  fontSize = '32px',
  fontWeight = '700',
  textAlign = 'center',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const Tag = tag;
  const hlStyle = highlightStyle === 'background'
    ? { backgroundColor: highlightColor, padding: '0 6px', borderRadius: '4px' }
    : highlightStyle === 'underline'
    ? { textDecoration: `underline ${highlightColor}`, textDecorationThickness: '3px', textUnderlineOffset: '4px' }
    : { color: highlightColor };

  return (
    <Tag ref={(ref) => connect(drag(ref))} className={`highlighted-heading ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ fontSize, fontWeight, textAlign, color: textColor, margin: 0, lineHeight: 1.4, ...style }}>
      {beforeText}<span style={hlStyle}>{highlightText}</span>{afterText}
    </Tag>
  );
};

export const HighlightedHeadingSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { beforeText = '', highlightText = '', afterText = '', tag = 'h2', highlightColor = '#fbbf24', highlightStyle = 'background', textColor = '#111827', fontSize = '32px', fontWeight = '700', textAlign = 'center' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Before Text</label><input type="text" value={beforeText} onChange={(e) => setProp((p) => { p.beforeText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Highlighted Text</label><input type="text" value={highlightText} onChange={(e) => setProp((p) => { p.highlightText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">After Text</label><input type="text" value={afterText} onChange={(e) => setProp((p) => { p.afterText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Tag</label><select value={tag} onChange={(e) => setProp((p) => { p.tag = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option></select></div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Highlight Style</h4>
        <div><select value={highlightStyle} onChange={(e) => setProp((p) => { p.highlightStyle = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="background">Background</option><option value="underline">Underline</option><option value="color">Color Only</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Highlight Color</label><input type="color" value={highlightColor} onChange={(e) => setProp((p) => { p.highlightColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Align</label><select value={textAlign} onChange={(e) => setProp((p) => { p.textAlign = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
        </div>
      </div>
    </div>
  );
};

HighlightedHeading.craft = {
  displayName: 'Highlighted Heading',
  props: { beforeText: 'We provide ', highlightText: 'amazing', afterText: ' solutions', tag: 'h2', highlightColor: '#fbbf24', highlightStyle: 'background', textColor: '#111827', fontSize: '32px', fontWeight: '700', textAlign: 'center', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
