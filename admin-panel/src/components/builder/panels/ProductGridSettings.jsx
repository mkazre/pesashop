import React from 'react';
import { useNode } from '@craftjs/core';
import {
  SelectControl,
  NumberControl,
} from '@/components/builder/controls/PropertyControls';
import Input from '@/components/common/Input';

export const ProductGridSettings = ({ activeTab = 'general' }) => {
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
        <NumberControl
          label="Columns"
          value={props.columns || 3}
          onChange={(val) => updateProp('columns', val || 3)}
          min={2}
          max={6}
        />
        <NumberControl
          label="Limit"
          value={props.limit || 12}
          onChange={(val) => updateProp('limit', val || 12)}
          min={1}
          max={100}
        />
      </div>
    );
  }

  if (activeTab === 'dynamic') {
    return (
      <div className="space-y-4">
        <SelectControl
          label="Data Source"
          value={props.source || 'all'}
          options={[
            { value: 'all', label: 'All Products' },
            { value: 'featured', label: 'Featured Products' },
            { value: 'category', label: 'By Category' },
            { value: 'tag', label: 'By Tag' },
          ]}
          onChange={(val) => updateProp('source', val)}
        />

        {props.source === 'category' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category ID</label>
            <Input
              type="text"
              value={props.categoryId || ''}
              onChange={(e) => updateProp('categoryId', e.target.value)}
              placeholder="Enter category ID or slug"
            />
          </div>
        )}

        {props.source === 'tag' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
            <Input
              type="text"
              value={props.tag || ''}
              onChange={(e) => updateProp('tag', e.target.value)}
              placeholder="Enter tag name"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};
