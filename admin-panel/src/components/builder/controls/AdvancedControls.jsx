import React from 'react';
import { Plus, Minus, Link, Unlink } from 'lucide-react';
import Input from '@/components/common/Input';
import { Checkbox } from './PropertyControls';

// Box Shadow Control
export const BoxShadowControl = ({ label, value, onChange }) => {
  const shadow = value || {
    enabled: false,
    hOffset: 0,
    vOffset: 0,
    blur: 0,
    spread: 0,
    color: 'rgba(0,0,0,0.1)',
    inset: false
  };

  const updateShadow = (key, val) => {
    const newShadow = { ...shadow, [key]: val };
    console.log('BoxShadow update:', key, val, newShadow);
    onChange(newShadow);
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Checkbox
          label="Enable"
          checked={shadow.enabled}
          onChange={(checked) => updateShadow('enabled', checked)}
        />
      </div>
      
      {shadow.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Horizontal</label>
              <Input
                type="number"
                value={shadow.hOffset}
                onChange={(e) => updateShadow('hOffset', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Vertical</label>
              <Input
                type="number"
                value={shadow.vOffset}
                onChange={(e) => updateShadow('vOffset', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Blur</label>
              <Input
                type="number"
                value={shadow.blur}
                onChange={(e) => updateShadow('blur', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Spread</label>
              <Input
                type="number"
                value={shadow.spread}
                onChange={(e) => updateShadow('spread', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <Input
                type="text"
                value={shadow.color}
                onChange={(e) => updateShadow('color', e.target.value)}
                className="w-full"
                placeholder="rgba(0,0,0,0.1)"
              />
            </div>
            <Checkbox
              label="Inset"
              checked={shadow.inset}
              onChange={(checked) => updateShadow('inset', checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Border Control
export const BorderControl = ({ label, value, onChange }) => {
  const border = value || {
    enabled: false,
    width: 1,
    style: 'solid',
    color: '#000000',
    radius: { top: 0, right: 0, bottom: 0, left: 0 },
    radiusLinked: true
  };

  const updateBorder = (key, val) => {
    const newBorder = { ...border, [key]: val };
    console.log('Border update:', key, val, newBorder);
    onChange(newBorder);
  };

  const updateRadius = (side, val) => {
    const numVal = val ? parseFloat(val) : 0;
    if (border.radiusLinked) {
      updateBorder('radius', { top: numVal, right: numVal, bottom: numVal, left: numVal });
    } else {
      updateBorder('radius', { ...border.radius, [side]: numVal });
    }
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Checkbox
          label="Enable"
          checked={border.enabled}
          onChange={(checked) => updateBorder('enabled', checked)}
        />
      </div>
      
      {border.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <Input
                type="number"
                value={border.width}
                onChange={(e) => updateBorder('width', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Style</label>
              <select
                value={border.style}
                onChange={(e) => updateBorder('style', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="groove">Groove</option>
                <option value="ridge">Ridge</option>
                <option value="inset">Inset</option>
                <option value="outset">Outset</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <Input
                type="text"
                value={border.color}
                onChange={(e) => updateBorder('color', e.target.value)}
                className="w-full"
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-gray-600">Border Radius</label>
              <button
                onClick={() => updateBorder('radiusLinked', !border.radiusLinked)}
                className="text-xs text-blue-600 hover:text-blue-700 p-1"
              >
                {border.radiusLinked ? <Link size={12} /> : <Unlink size={12} />}
              </button>
            </div>
            
            {border.radiusLinked ? (
              <Input
                type="number"
                value={border.radius.top}
                onChange={(e) => updateRadius('top', e.target.value)}
                className="w-full"
                placeholder="0"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={border.radius.top}
                  onChange={(e) => updateRadius('top', e.target.value)}
                  placeholder="Top"
                />
                <Input
                  type="number"
                  value={border.radius.right}
                  onChange={(e) => updateRadius('right', e.target.value)}
                  placeholder="Right"
                />
                <Input
                  type="number"
                  value={border.radius.bottom}
                  onChange={(e) => updateRadius('bottom', e.target.value)}
                  placeholder="Bottom"
                />
                <Input
                  type="number"
                  value={border.radius.left}
                  onChange={(e) => updateRadius('left', e.target.value)}
                  placeholder="Left"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Typography Control
export const TypographyControl = ({ label, value, onChange }) => {
  const typography = value || {
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'left',
    textTransform: 'none',
    color: '#000000',
    fontStyle: 'normal',
    textDecoration: 'none'
  };

  const updateTypography = (key, val) => {
    const newTypography = { ...typography, [key]: val };
    console.log('Typography update:', key, val, newTypography);
    onChange(newTypography);
  };

  const fontFamilies = [
    { value: 'inherit', label: 'Inherit' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'system-ui, sans-serif', label: 'System UI' }
  ];

  const fontWeights = [
    { value: '100', label: 'Thin (100)' },
    { value: '200', label: 'Extra Light (200)' },
    { value: '300', label: 'Light (300)' },
    { value: 'normal', label: 'Normal (400)' },
    { value: '500', label: 'Medium (500)' },
    { value: '600', label: 'Semi Bold (600)' },
    { value: 'bold', label: 'Bold (700)' },
    { value: '800', label: 'Extra Bold (800)' },
    { value: '900', label: 'Black (900)' }
  ];

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Family</label>
            <select
              value={typography.fontFamily}
              onChange={(e) => updateTypography('fontFamily', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Size</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={typography.fontSize}
                onChange={(e) => updateTypography('fontSize', parseFloat(e.target.value) || 16)}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
            <select
              value={typography.fontWeight}
              onChange={(e) => updateTypography('fontWeight', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {fontWeights.map(weight => (
                <option key={weight.value} value={weight.value}>{weight.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Line Height</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={typography.lineHeight}
                onChange={(e) => updateTypography('lineHeight', parseFloat(e.target.value) || 1.5)}
                step="0.1"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Letter Spacing</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={typography.letterSpacing}
                onChange={(e) => updateTypography('letterSpacing', parseFloat(e.target.value) || 0)}
                step="0.1"
                className="flex-1"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Text Align</label>
            <select
              value={typography.textAlign}
              onChange={(e) => updateTypography('textAlign', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Text Transform</label>
            <select
              value={typography.textTransform}
              onChange={(e) => updateTypography('textTransform', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="none">None</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Color</label>
            <Input
              type="text"
              value={typography.color}
              onChange={(e) => updateTypography('color', e.target.value)}
              className="w-full"
              placeholder="#000000"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Font Style</label>
            <select
              value={typography.fontStyle}
              onChange={(e) => updateTypography('fontStyle', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
              <option value="oblique">Oblique</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Decoration</label>
            <select
              value={typography.textDecoration}
              onChange={(e) => updateTypography('textDecoration', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="none">None</option>
              <option value="underline">Underline</option>
              <option value="overline">Overline</option>
              <option value="line-through">Line Through</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Position Control
export const PositionControl = ({ label, value, onChange }) => {
  const position = value || {
    type: 'static',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
    zIndex: 'auto'
  };

  const updatePosition = (key, val) => {
    const newPosition = { ...position, [key]: val };
    console.log('Position update:', key, val, newPosition);
    onChange(newPosition);
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Position Type</label>
          <select
            value={position.type}
            onChange={(e) => updatePosition('type', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="static">Static</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="fixed">Fixed</option>
            <option value="sticky">Sticky</option>
          </select>
        </div>
        
        {position.type !== 'static' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Top</label>
              <Input
                type="text"
                value={position.top}
                onChange={(e) => updatePosition('top', e.target.value)}
                className="w-full"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Right</label>
              <Input
                type="text"
                value={position.right}
                onChange={(e) => updatePosition('right', e.target.value)}
                className="w-full"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bottom</label>
              <Input
                type="text"
                value={position.bottom}
                onChange={(e) => updatePosition('bottom', e.target.value)}
                className="w-full"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Left</label>
              <Input
                type="text"
                value={position.left}
                onChange={(e) => updatePosition('left', e.target.value)}
                className="w-full"
                placeholder="auto"
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Z-Index</label>
          <Input
            type="text"
            value={position.zIndex}
            onChange={(e) => updatePosition('zIndex', e.target.value)}
            className="w-full"
            placeholder="auto"
          />
        </div>
      </div>
    </div>
  );
};

// Transform Control
export const TransformControl = ({ label, value, onChange }) => {
  const transform = value || {
    enabled: false,
    rotate: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1 },
    skew: { x: 0, y: 0 },
    translate: { x: 0, y: 0 }
  };

  const updateTransform = (key, val) => {
    const newTransform = { ...transform, [key]: val };
    console.log('Transform update:', key, val, newTransform);
    onChange(newTransform);
  };

  const updateNested = (category, key, val) => {
    const updatedNested = { ...transform[category], [key]: val };
    updateTransform(category, updatedNested);
  };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Checkbox
          label="Enable"
          checked={transform.enabled}
          onChange={(checked) => updateTransform('enabled', checked)}
        />
      </div>
      
      {transform.enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Rotate (deg)</label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                value={transform.rotate.x}
                onChange={(e) => updateNested('rotate', 'x', parseFloat(e.target.value) || 0)}
                placeholder="X"
              />
              <Input
                type="number"
                value={transform.rotate.y}
                onChange={(e) => updateNested('rotate', 'y', parseFloat(e.target.value) || 0)}
                placeholder="Y"
              />
              <Input
                type="number"
                value={transform.rotate.z}
                onChange={(e) => updateNested('rotate', 'z', parseFloat(e.target.value) || 0)}
                placeholder="Z"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Scale</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={transform.scale.x}
                onChange={(e) => updateNested('scale', 'x', parseFloat(e.target.value) || 1)}
                step="0.1"
                placeholder="X"
              />
              <Input
                type="number"
                value={transform.scale.y}
                onChange={(e) => updateNested('scale', 'y', parseFloat(e.target.value) || 1)}
                step="0.1"
                placeholder="Y"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Skew (deg)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={transform.skew.x}
                onChange={(e) => updateNested('skew', 'x', parseFloat(e.target.value) || 0)}
                placeholder="X"
              />
              <Input
                type="number"
                value={transform.skew.y}
                onChange={(e) => updateNested('skew', 'y', parseFloat(e.target.value) || 0)}
                placeholder="Y"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Translate (px)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                value={transform.translate.x}
                onChange={(e) => updateNested('translate', 'x', parseFloat(e.target.value) || 0)}
                placeholder="X"
              />
              <Input
                type="number"
                value={transform.translate.y}
                onChange={(e) => updateNested('translate', 'y', parseFloat(e.target.value) || 0)}
                placeholder="Y"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Animation Control
export const AnimationControl = ({ label, value, onChange }) => {
  const animation = value || {
    enabled: false,
    name: '',
    duration: 1,
    delay: 0,
    timingFunction: 'ease',
    iterationCount: 1,
    direction: 'normal',
    fillMode: 'none'
  };

  const updateAnimation = (key, val) => {
    const newAnimation = { ...animation, [key]: val };
    console.log('Animation update:', key, val, newAnimation);
    onChange(newAnimation);
  };

  const timingFunctions = [
    { value: 'ease', label: 'Ease' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In Out' },
    { value: 'linear', label: 'Linear' },
    { value: 'step-start', label: 'Step Start' },
    { value: 'step-end', label: 'Step End' }
  ];

  return (
    <div className="mb-4 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <Checkbox
          label="Enable"
          checked={animation.enabled}
          onChange={(checked) => updateAnimation('enabled', checked)}
        />
      </div>
      
      {animation.enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Animation Name</label>
            <Input
              type="text"
              value={animation.name}
              onChange={(e) => updateAnimation('name', e.target.value)}
              className="w-full"
              placeholder="fadeIn"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Duration (s)</label>
              <Input
                type="number"
                value={animation.duration}
                onChange={(e) => updateAnimation('duration', parseFloat(e.target.value) || 1)}
                step="0.1"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Delay (s)</label>
              <Input
                type="number"
                value={animation.delay}
                onChange={(e) => updateAnimation('delay', parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Timing Function</label>
            <select
              value={animation.timingFunction}
              onChange={(e) => updateAnimation('timingFunction', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {timingFunctions.map(func => (
                <option key={func.value} value={func.value}>{func.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Iteration Count</label>
              <Input
                type="text"
                value={animation.iterationCount}
                onChange={(e) => updateAnimation('iterationCount', e.target.value)}
                className="w-full"
                placeholder="1 or infinite"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Direction</label>
              <select
                value={animation.direction}
                onChange={(e) => updateAnimation('direction', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="normal">Normal</option>
                <option value="reverse">Reverse</option>
                <option value="alternate">Alternate</option>
                <option value="alternate-reverse">Alternate Reverse</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Fill Mode</label>
            <select
              value={animation.fillMode}
              onChange={(e) => updateAnimation('fillMode', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="none">None</option>
              <option value="forwards">Forwards</option>
              <option value="backwards">Backwards</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
