import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const ShowMoreLess = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  collapsedHeight = '80px',
  moreText = 'Show More',
  lessText = 'Show Less',
  buttonColor = '#3b82f6',
  fontSize = '14px',
  textColor = '#374151',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const [expanded, setExpanded] = useState(false);

  return (
    <div ref={(ref) => connect(drag(ref))} className={`show-more-less ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`} style={style}>
      <div style={{ maxHeight: expanded ? 'none' : collapsedHeight, overflow: 'hidden', transition: 'max-height 0.3s ease', fontSize, color: textColor, lineHeight: 1.6 }}>
        {content}
      </div>
      {!expanded && <div style={{ background: 'linear-gradient(transparent, white)', height: '40px', marginTop: '-40px', position: 'relative' }} />}
      <button onClick={() => setExpanded(!expanded)} style={{ display: 'block', margin: '8px auto 0', padding: '6px 16px', background: 'none', border: 'none', color: buttonColor, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
        {expanded ? lessText : moreText}
      </button>
    </div>
  );
};

export const ShowMoreLessSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { content = '', collapsedHeight = '80px', moreText = '', lessText = '', buttonColor = '#3b82f6', fontSize = '14px', textColor = '#374151' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Text</label><textarea value={content} onChange={(e) => setProp((p) => { p.content = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" rows={4} /></div>
        <div><label className="block text-sm font-medium text-gray-700">Collapsed Height</label><input type="text" value={collapsedHeight} onChange={(e) => setProp((p) => { p.collapsedHeight = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">More Text</label><input type="text" value={moreText} onChange={(e) => setProp((p) => { p.moreText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Less Text</label><input type="text" value={lessText} onChange={(e) => setProp((p) => { p.lessText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Button Color</label><input type="color" value={buttonColor} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Text Color</label><input type="color" value={textColor} onChange={(e) => setProp((p) => { p.textColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

ShowMoreLess.craft = {
  displayName: 'Show More/Less',
  props: { content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.', collapsedHeight: '80px', moreText: 'Show More', lessText: 'Show Less', buttonColor: '#3b82f6', fontSize: '14px', textColor: '#374151', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
