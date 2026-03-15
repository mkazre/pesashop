import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const FancyHeading = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  text = 'Fancy Heading',
  tag = 'h2',
  gradientFrom = '#3b82f6',
  gradientTo = '#8b5cf6',
  gradientDirection = 'to right',
  useGradient = true,
  textColor = '#111827',
  fontSize = '36px',
  fontWeight = '700',
  textAlign = 'center',
  letterSpacing = '0px',
  textTransform = 'none',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const Tag = tag;
  const gradientStyle = useGradient ? { background: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : { color: textColor };

  return (
    <Tag ref={(ref) => connect(drag(ref))} className={`fancy-heading ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ fontSize, fontWeight, textAlign, letterSpacing, textTransform, margin: 0, lineHeight: 1.2, ...gradientStyle, ...style }}>
      {text}
    </Tag>
  );
};

export const FancyHeadingSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { text = '', tag = 'h2', useGradient = true, gradientFrom = '#3b82f6', gradientTo = '#8b5cf6', gradientDirection = 'to right', textColor = '#111827', fontSize = '36px', fontWeight = '700', textAlign = 'center', letterSpacing = '0px', textTransform = 'none' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text</label><input type="text" value={text} onChange={(e) => setProp((p) => { p.text = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Tag</label>
          <select value={tag} onChange={(e) => setProp((p) => { p.tag = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option><option value="h5">H5</option><option value="h6">H6</option>
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Color</h4>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useGradient} onChange={(e) => setProp((p) => { p.useGradient = e.target.checked; })} />Use Gradient</label>
        {useGradient ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">From</label><input type="color" value={gradientFrom} onChange={(e) => setProp((p) => { p.gradientFrom = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
              <div><label className="block text-sm font-medium text-gray-700">To</label><input type="color" value={gradientTo} onChange={(e) => setProp((p) => { p.gradientTo = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">Direction</label>
              <select value={gradientDirection} onChange={(e) => setProp((p) => { p.gradientDirection = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="to right">Left to Right</option><option value="to left">Right to Left</option><option value="to bottom">Top to Bottom</option><option value="to top">Bottom to Top</option><option value="to bottom right">Diagonal</option>
              </select>
            </div>
          </>
        ) : (
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        )}
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Typography</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Font Size</label><input type="text" value={fontSize} onChange={(e) => setProp((p) => { p.fontSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Font Weight</label>
            <select value={fontWeight} onChange={(e) => setProp((p) => { p.fontWeight = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi Bold</option><option value="700">Bold</option><option value="800">Extra Bold</option><option value="900">Black</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Text Align</label>
            <select value={textAlign} onChange={(e) => setProp((p) => { p.textAlign = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">Transform</label>
            <select value={textTransform} onChange={(e) => setProp((p) => { p.textTransform = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Letter Spacing</label><input type="text" value={letterSpacing} onChange={(e) => setProp((p) => { p.letterSpacing = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
      </div>
    </div>
  );
};

FancyHeading.craft = {
  displayName: 'Fancy Heading',
  props: { text: 'Fancy Heading', tag: 'h2', gradientFrom: '#3b82f6', gradientTo: '#8b5cf6', gradientDirection: 'to right', useGradient: true, textColor: '#111827', fontSize: '36px', fontWeight: '700', textAlign: 'center', letterSpacing: '0px', textTransform: 'none', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
