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

// Advanced Spacing Control (padding/margin) - Oxygen Builder style
export const AdvancedSpacingControl = ({ label, value, onChange, type = 'padding' }) => {
  const spacing = value || { top: '0px', right: '0px', bottom: '0px', left: '0px' };
  const [linked, setLinked] = React.useState(
    spacing.top === spacing.right && spacing.right === spacing.bottom && spacing.bottom === spacing.left
  );

  const updateSpacing = (side, val) => {
    const newSpacing = { ...spacing, [side]: val || '0px' };
    if (linked) {
      // If linked, apply same value to all sides
      const uniformSpacing = { top: val, right: val, bottom: val, left: val };
      onChange(uniformSpacing);
    } else {
      onChange(newSpacing);
    }
  };

  const presetValues = ['0px', '4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'];
  const sideLabels = { top: 'T', right: 'R', bottom: 'B', left: 'L' };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLinked(!linked)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              linked 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {linked ? 'Linked' : 'Unlinked'}
          </button>
        </div>
      </div>
      
      {linked ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={spacing.top || '0px'}
              onChange={(e) => updateSpacing('all', e.target.value)}
              placeholder="0px"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-500">All sides</span>
          </div>
          <div className="flex gap-1">
            {presetValues.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => updateSpacing('all', v)}
                className={`flex-1 px-2 py-1 text-[10px] rounded border transition-colors ${
                  spacing.top === v 
                    ? 'bg-blue-100 border-blue-400 text-blue-700' 
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Visual box model representation */}
          <div className="flex justify-center mb-2">
            <div className="relative bg-gray-100 p-2 rounded">
              <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                Content
              </div>
              {/* Top */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <input
                  type="text"
                  value={spacing.top || '0px'}
                  onChange={(e) => updateSpacing('top', e.target.value)}
                  className="w-12 px-1 py-0.5 text-[10px] border border-gray-300 rounded text-center"
                  placeholder="0"
                />
                <div className="text-[8px] text-center text-gray-500 mt-0.5">T</div>
              </div>
              {/* Right */}
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
                <input
                  type="text"
                  value={spacing.right || '0px'}
                  onChange={(e) => updateSpacing('right', e.target.value)}
                  className="w-12 px-1 py-0.5 text-[10px] border border-gray-300 rounded text-center"
                  placeholder="0"
                />
                <div className="text-[8px] text-center text-gray-500 mt-0.5">R</div>
              </div>
              {/* Bottom */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <input
                  type="text"
                  value={spacing.bottom || '0px'}
                  onChange={(e) => updateSpacing('bottom', e.target.value)}
                  className="w-12 px-1 py-0.5 text-[10px] border border-gray-300 rounded text-center"
                  placeholder="0"
                />
                <div className="text-[8px] text-center text-gray-500 mt-0.5">B</div>
              </div>
              {/* Left */}
              <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
                <input
                  type="text"
                  value={spacing.left || '0px'}
                  onChange={(e) => updateSpacing('left', e.target.value)}
                  className="w-12 px-1 py-0.5 text-[10px] border border-gray-300 rounded text-center"
                  placeholder="0"
                />
                <div className="text-[8px] text-center text-gray-500 mt-0.5">L</div>
              </div>
            </div>
          </div>
          
          {/* Individual side inputs */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(sideLabels).map(([side, label]) => (
              <div key={side} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-4">{label}:</span>
                <input
                  type="text"
                  value={spacing[side] || '0px'}
                  onChange={(e) => updateSpacing(side, e.target.value)}
                  placeholder="0px"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
          
          {/* Presets for individual sides */}
          <div className="flex gap-1">
            {presetValues.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  Object.keys(sideLabels).forEach(side => updateSpacing(side, v));
                }}
                className="flex-1 px-1 py-0.5 text-[9px] border border-gray-200 rounded hover:bg-gray-50"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Advanced Border Control - Oxygen Builder style
export const AdvancedBorderControl = ({ value, onChange }) => {
  const border = value || {
    width: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    style: 'solid',
    color: '#000000',
    radius: { topLeft: '0px', topRight: '0px', bottomRight: '0px', bottomLeft: '0px' }
  };

  const updateBorder = (section, keyOrVal, val) => {
    const newBorder = { ...border };
    if (section === 'width' || section === 'radius') {
      newBorder[section] = { ...newBorder[section], [keyOrVal]: val };
    } else {
      // For flat properties like 'style' and 'color', keyOrVal IS the value
      newBorder[section] = keyOrVal;
    }
    onChange(newBorder);
  };

  const borderStyles = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
    { value: 'groove', label: 'Groove' },
    { value: 'ridge', label: 'Ridge' },
    { value: 'inset', label: 'Inset' },
    { value: 'outset', label: 'Outset' },
  ];

  const widthPresets = ['0px', '1px', '2px', '3px', '4px', '5px', '8px', '10px'];
  const radiusPresets = ['0px', '4px', '8px', '12px', '16px', '20px', '50%', '9999px'];

  return (
    <div className="mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Border</label>
      </div>
      
      {/* Border Style */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
        <div className="grid grid-cols-3 gap-1">
          {borderStyles.map(style => (
            <button
              key={style.value}
              type="button"
              onClick={() => updateBorder('style', style.value)}
              className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                border.style === style.value
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Width */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
        <div className="grid grid-cols-4 gap-1">
          {widthPresets.map(width => (
            <button
              key={width}
              type="button"
              onClick={() => {
                onChange({ ...border, width: { top: width, right: width, bottom: width, left: width } });
              }}
              className="px-1 py-0.5 text-[9px] border border-gray-200 rounded hover:bg-gray-50"
            >
              {width}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={border.color || '#000000'}
            onChange={(e) => updateBorder('color', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={border.color || ''}
            onChange={(e) => updateBorder('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
        <div className="grid grid-cols-4 gap-1">
          {radiusPresets.map(radius => (
            <button
              key={radius}
              type="button"
              onClick={() => {
                onChange({ ...border, radius: { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius } });
              }}
              className="px-1 py-0.5 text-[9px] border border-gray-200 rounded hover:bg-gray-50"
            >
              {radius}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Box Shadow Control - Oxygen Builder style
export const BoxShadowControl = ({ value, onChange }) => {
  const shadow = value || {
    x: '0px',
    y: '0px',
    blur: '0px',
    spread: '0px',
    color: 'rgba(0, 0, 0, 0.2)',
    inset: false
  };

  const updateShadow = (key, val) => {
    const newShadow = { ...shadow, [key]: val };
    onChange(newShadow);
  };

  const shadowPresets = [
    { label: 'None', value: { x: '0px', y: '0px', blur: '0px', spread: '0px', color: 'rgba(0, 0, 0, 0)', inset: false } },
    { label: 'Small', value: { x: '0px', y: '2px', blur: '4px', spread: '0px', color: 'rgba(0, 0, 0, 0.1)', inset: false } },
    { label: 'Medium', value: { x: '0px', y: '4px', blur: '8px', spread: '0px', color: 'rgba(0, 0, 0, 0.15)', inset: false } },
    { label: 'Large', value: { x: '0px', y: '8px', blur: '16px', spread: '0px', color: 'rgba(0, 0, 0, 0.2)', inset: false } },
    { label: 'Inset', value: { x: '0px', y: '2px', blur: '4px', spread: '0px', color: 'rgba(0, 0, 0, 0.2)', inset: true } },
    { label: 'Glow', value: { x: '0px', y: '0px', blur: '20px', spread: '0px', color: 'rgba(59, 130, 246, 0.5)', inset: false } },
  ];

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Box Shadow</label>
      </div>
      
      {/* Shadow Presets */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Presets</label>
        <div className="grid grid-cols-3 gap-1">
          {shadowPresets.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.value)}
              className="px-2 py-1 text-[10px] rounded border transition-colors hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shadow Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">X Offset</label>
          <input
            type="text"
            value={shadow.x || ''}
            onChange={(e) => updateShadow('x', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="0px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Y Offset</label>
          <input
            type="text"
            value={shadow.y || ''}
            onChange={(e) => updateShadow('y', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="0px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Blur</label>
          <input
            type="text"
            value={shadow.blur || ''}
            onChange={(e) => updateShadow('blur', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="0px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Spread</label>
          <input
            type="text"
            value={shadow.spread || ''}
            onChange={(e) => updateShadow('spread', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="0px"
          />
        </div>
      </div>

      {/* Shadow Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(shadow.color || '').includes('rgba') ? '#000000' : (shadow.color || '#000000')}
            onChange={(e) => {
              const hex = e.target.value;
              const rgba = `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, 0.2)`;
              updateShadow('color', rgba);
            }}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={shadow.color || ''}
            onChange={(e) => updateShadow('color', e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
            placeholder="rgba(0, 0, 0, 0.2)"
          />
        </div>
      </div>

      {/* Inset Option */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={shadow.inset || false}
          onChange={(e) => updateShadow('inset', e.target.checked)}
          className="rounded border-gray-300"
        />
        <label className="text-xs text-gray-600">Inset Shadow</label>
      </div>
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
