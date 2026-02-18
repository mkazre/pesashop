import React from 'react';
import { useNode } from '@craftjs/core';
import {
  TextControl,
  SelectControl,
} from '@/components/builder/controls/PropertyControls';
import Input from '@/components/common/Input';

export const PriceDisplaySettings = ({ activeTab = 'general' }) => {
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
          label="Currency"
          value={props.currency || 'ZAR'}
          options={['ZAR', 'USD', 'EUR', 'GBP']}
          onChange={(val) => updateProp('currency', val)}
        />
        <TextControl
          label="Price Format"
          value={props.format || 'R {price}'}
          onChange={(val) => updateProp('format', val)}
          placeholder="R {price}"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.showSalePrice !== false}
            onChange={(e) => updateProp('showSalePrice', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Show Sale Price</span>
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
            This component will automatically use product data from its parent Repeater component.
          </div>
        )}
      </div>
    );
  }

  return null;
};
