import React from 'react';
import { useNode } from '@craftjs/core';
import {
  SelectControl,
  NumberControl,
} from '@/components/builder/controls/PropertyControls';

export const CategoryListSettings = ({ activeTab = 'general' }) => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  const updateProp = (propName, value) => {
    setProp((props) => {
      props[propName] = value;
    });
  };

  if (activeTab === 'general') {
    return (
      <div className="space-y-4">
        <SelectControl
          label="Layout"
          value={props.layout || 'grid'}
          options={['grid', 'list']}
          onChange={(val) => updateProp('layout', val)}
        />
        {props.layout === 'grid' && (
          <NumberControl
            label="Columns"
            value={props.columns || 3}
            onChange={(val) => updateProp('columns', val || 3)}
            min={2}
            max={6}
          />
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Display Options</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showImage !== false}
              onChange={(e) => updateProp('showImage', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Image</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showDescription === true}
              onChange={(e) => updateProp('showDescription', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Description</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
