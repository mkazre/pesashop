import React from 'react';
import { SketchPicker } from 'react-color';
import Select from 'react-select';
import Input from '@/components/common/Input';

// Color Picker Control
export const ColorControl = ({ label, value, onChange }) => {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <div
          onClick={() => setShowPicker(!showPicker)}
          className="w-10 h-10 border-2 border-gray-300 rounded cursor-pointer"
          style={{ backgroundColor: value || '#000000' }}
        />
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        {showPicker && (
          <div className="absolute z-50 mt-2">
            <div
              className="fixed inset-0"
              onClick={() => setShowPicker(false)}
            />
            <SketchPicker
              color={value || '#000000'}
              onChangeComplete={(color) => {
                onChange(color.hex);
                setShowPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Select Control
export const SelectControl = ({ label, value, options, onChange }) => {
  const selectOptions = options.map((opt) => ({
    value: typeof opt === 'string' ? opt : opt.value,
    label: typeof opt === 'string' ? opt : opt.label,
  }));

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <Select
        value={selectOptions.find((opt) => opt.value === value)}
        onChange={(selected) => onChange(selected?.value)}
        options={selectOptions}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

// Number Input Control
export const NumberControl = ({ label, value, onChange, min, max, unit = '' }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
          min={min}
          max={max}
          className="flex-1"
        />
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
};

// Text Input Control
export const TextControl = ({ label, value, onChange, placeholder, multiline = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      ) : (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

// Spacing Control (padding/margin)
export const SpacingControl = ({ label, value, onChange }) => {
  const spacing = value || { top: 0, right: 0, bottom: 0, left: 0 };
  const [linked, setLinked] = React.useState(true);

  const updateSpacing = (side, val) => {
    const numVal = val ? parseFloat(val) : 0;
    if (linked) {
      // If linked, apply same value to all sides
      onChange({ top: numVal, right: numVal, bottom: numVal, left: numVal });
    } else {
      const newSpacing = { ...spacing, [side]: numVal };
      onChange(newSpacing);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          onClick={() => setLinked(!linked)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {linked ? 'Unlink' : 'Link'}
        </button>
      </div>
      {linked ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={spacing.top || ''}
            onChange={(e) => updateSpacing('top', e.target.value)}
            placeholder="0"
            className="flex-1"
          />
          <span className="text-sm text-gray-500">px</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={spacing.top || ''}
            onChange={(e) => updateSpacing('top', e.target.value)}
            placeholder="Top"
          />
          <Input
            type="number"
            value={spacing.right || ''}
            onChange={(e) => updateSpacing('right', e.target.value)}
            placeholder="Right"
          />
          <Input
            type="number"
            value={spacing.bottom || ''}
            onChange={(e) => updateSpacing('bottom', e.target.value)}
            placeholder="Bottom"
          />
          <Input
            type="number"
            value={spacing.left || ''}
            onChange={(e) => updateSpacing('left', e.target.value)}
            placeholder="Left"
          />
        </div>
      )}
    </div>
  );
};

// Checkbox Control (Oxygen-style)
export const Checkbox = ({ label, checked, onChange, description }) => {
  return (
    <div className="mb-4 flex items-start gap-2">
      <input
        type="checkbox"
        id={`checkbox-${label?.replace(/\s/g, '-')}`}
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <div className="flex-1">
        {label && <label htmlFor={`checkbox-${label?.replace(/\s/g, '-')}`} className="block text-sm font-medium text-gray-700">{label}</label>}
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
};

// Custom CSS Control
export const CustomCSSControl = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder=".my-class { color: red; }"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        rows={6}
      />
    </div>
  );
};
