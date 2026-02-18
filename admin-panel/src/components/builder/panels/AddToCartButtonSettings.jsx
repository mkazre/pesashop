import React from 'react';
import { useNode } from '@craftjs/core';
import {
  TextControl,
  NumberControl,
  SelectControl,
} from '@/components/builder/controls/PropertyControls';
import Input from '@/components/common/Input';

export const AddToCartButtonSettings = ({ activeTab = 'general' }) => {
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
        <TextControl
          label="Button Text"
          value={props.text || 'Add to Cart'}
          onChange={(val) => updateProp('text', val)}
        />
        <TextControl
          label="Success Text"
          value={props.successText || 'Added!'}
          onChange={(val) => updateProp('successText', val)}
        />
        <NumberControl
          label="Default Quantity"
          value={props.quantity || 1}
          onChange={(val) => updateProp('quantity', val || 1)}
          min={1}
        />
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
              { value: 'static', label: 'Static Product ID' },
              { value: 'repeater', label: 'From Repeater (auto-bound)' },
            ]}
            onChange={(val) => updateProp('productSource', val)}
          />
        </div>
        
        {props.productSource === 'static' && (
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
            This button will automatically use the product ID from its parent Repeater component.
          </div>
        )}
      </div>
    );
  }

  return null;
};
