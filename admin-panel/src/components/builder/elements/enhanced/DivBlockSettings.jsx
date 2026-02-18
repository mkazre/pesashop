import React from 'react';
import { useEditor } from '@craftjs/core';
import { TextControl, ColorControl, NumberControl } from '@/components/builder/controls/PropertyControls';

export const DivBlockSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const {
    display = 'block',
    width = 'auto',
    height = 'auto',
    backgroundColor = 'transparent',
    margin = '0px',
    padding = '0px',
    border = 'none',
    borderRadius = '0px',
    boxShadow = 'none'
  } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Display</h4>
        
        <select
          value={display}
          onChange={(e) => setProp((p) => { p.display = e.target.value; })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="block">Block</option>
          <option value="inline">Inline</option>
          <option value="inline-block">Inline Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
          <option value="hidden">Hidden</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Dimensions</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((p) => { p.width = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="auto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((p) => { p.height = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="auto"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Spacing</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Margin</label>
            <input
              type="text"
              value={margin}
              onChange={(e) => setProp((p) => { p.margin = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="0px"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Padding</label>
            <input
              type="text"
              value={padding}
              onChange={(e) => setProp((p) => { p.padding = e.target.value; })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="0px"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Appearance</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Background Color"
            value={backgroundColor}
            onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
          />
          
          <ColorControl
            label="Border Color"
            value={border}
            onChange={(value) => setProp((p) => { p.border = value; })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Border Radius</label>
          <input
            type="text"
            value={borderRadius}
            onChange={(e) => setProp((p) => { p.borderRadius = e.target.value; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="0px"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Box Shadow</label>
          <input
            type="text"
            value={boxShadow}
            onChange={(e) => setProp((p) => { p.boxShadow = e.target.value; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="none"
          />
        </div>
      </div>
    </div>
  );
};

export default DivBlockSettings;
