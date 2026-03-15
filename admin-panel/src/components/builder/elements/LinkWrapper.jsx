import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const LinkWrapper = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  url = '#',
  target = '_self',
  display = 'block',
  className = '',
  style = {},
  children,
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
      className={`link-wrapper-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display, textDecoration: 'none', color: 'inherit', minHeight: '40px', ...style }}
      onClick={(e) => e.preventDefault()}
    >
      {children || <div style={{ padding: '16px', border: '2px dashed #d1d5db', borderRadius: '8px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Link Wrapper - Drop elements here</div>}
    </a>
  );
};

export const LinkWrapperSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { url = '', target = '_self' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Link</h4>
        <div><label className="block text-sm font-medium text-gray-700">URL</label><input type="text" value={url} onChange={(e) => setProp((p) => { p.url = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="https://" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Target</label><select value={target} onChange={(e) => setProp((p) => { p.target = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"><option value="_self">Same Window</option><option value="_blank">New Window</option></select></div>
      </div>
    </div>
  );
};

LinkWrapper.craft = {
  displayName: 'Link Wrapper',
  props: { url: '#', target: '_self', display: 'block', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => true, canMoveOut: () => true },
  isCanvas: true,
};
