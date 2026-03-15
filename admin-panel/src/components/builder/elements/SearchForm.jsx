import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const SearchForm = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  placeholder = 'Search...',
  buttonText = 'Search',
  showButton = true,
  borderRadius = '8px',
  backgroundColor = '#ffffff',
  borderColor = '#d1d5db',
  buttonColor = '#3b82f6',
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
    <div
      ref={(ref) => connect(drag(ref))}
      className={`search-form-element ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
    >
      <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder={placeholder}
          style={{
            flex: 1, padding: '10px 16px', fontSize: '14px',
            border: `1px solid ${borderColor}`, borderRadius, backgroundColor,
            outline: 'none',
          }}
          readOnly
        />
        {showButton && (
          <button
            type="submit"
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 500,
              backgroundColor: buttonColor, color: '#fff', border: 'none',
              borderRadius, cursor: 'pointer',
            }}
          >
            {buttonText}
          </button>
        )}
      </form>
    </div>
  );
};

export const SearchFormSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { placeholder = '', buttonText = '', showButton = true, borderRadius = '8px', borderColor = '#d1d5db', buttonColor = '#3b82f6' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Content</h4>
        <div><label className="block text-sm font-medium text-gray-700">Placeholder</label><input type="text" value={placeholder} onChange={(e) => setProp((p) => { p.placeholder = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showButton} onChange={(e) => setProp((p) => { p.showButton = e.target.checked; })} />Show Button</label>
        {showButton && <div><label className="block text-sm font-medium text-gray-700">Button Text</label><input type="text" value={buttonText} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>}
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Style</h4>
        <div><label className="block text-sm font-medium text-gray-700">Border Radius</label><input type="text" value={borderRadius} onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Border Color</label><input type="color" value={borderColor} onChange={(e) => setProp((p) => { p.borderColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Button Color</label><input type="color" value={buttonColor} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

SearchForm.craft = {
  displayName: 'Search Form',
  props: { placeholder: 'Search...', buttonText: 'Search', showButton: true, borderRadius: '8px', backgroundColor: '#ffffff', borderColor: '#d1d5db', buttonColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
