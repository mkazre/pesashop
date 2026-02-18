import React from 'react';
import { useNode } from '@craftjs/core';
import {
  TextControl,
  SelectControl,
  ColorControl,
} from '@/components/builder/controls/PropertyControls';
import Input from '@/components/common/Input';

export const ProductCardSettings = ({ activeTab = 'general' }) => {
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
          value={props.layout || 'default'}
          options={['default', 'compact', 'detailed']}
          onChange={(val) => updateProp('layout', val)}
        />
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
              checked={props.showTitle !== false}
              onChange={(e) => updateProp('showTitle', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Title</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showPrice !== false}
              onChange={(e) => updateProp('showPrice', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Price</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showButton !== false}
              onChange={(e) => updateProp('showButton', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Show Button</span>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'dynamic') {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Source</label>
          <SelectControl
            value={props.productSource || 'static'}
            options={[
              { value: 'static', label: 'Static (Use preview product)' },
              { value: 'id', label: 'Product ID' },
              { value: 'repeater', label: 'From Repeater (auto-bound)' },
            ]}
            onChange={(val) => updateProp('productSource', val)}
          />
        </div>
        
        {props.productSource === 'id' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label>
            <Input
              type="text"
              value={props.productId || ''}
              onChange={(e) => updateProp('productId', e.target.value)}
              placeholder="Enter product ID or slug"
            />
          </div>
        )}

        {props.productSource === 'repeater' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            This component will automatically use product data from its parent Repeater component.
          </div>
        )}
      </div>
    );
  }

  return null;
};
