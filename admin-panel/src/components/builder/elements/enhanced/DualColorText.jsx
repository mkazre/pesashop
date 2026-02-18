import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Palette } from 'lucide-react';
import { TextControl, ColorControl } from '@/components/builder/controls/PropertyControls';

export const DualColorText = ({ text = 'Dual Color Text', className = '', style = {} }) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const { splitPosition = 50, firstColor = '#3b82f6', secondColor = '#10b981' } = style;

  const renderDualColorText = () => {
    if (!text) return null;
    
    const splitIndex = Math.floor((splitPosition / 100) * text.length);
    const firstPart = text.substring(0, splitIndex);
    const secondPart = text.substring(splitIndex);

    return (
      <>
        <span style={{ color: firstColor }}>{firstPart}</span>
        <span style={{ color: secondColor }}>{secondPart}</span>
      </>
    );
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`dual-color-text ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...style,
        fontSize: style.fontSize || '24px',
        fontWeight: style.fontWeight || 'bold',
        lineHeight: style.lineHeight || '1.2'
      }}
    >
      {renderDualColorText()}
    </div>
  );
};

// Settings Panel Component
export const DualColorTextSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    text = 'Dual Color Text',
      splitPosition = 50,
      firstColor = '#3b82f6',
      secondColor = '#10b981',
      fontSize = 24,
      fontWeight = 'bold',
      lineHeight = 1.2
  } = nodeProps;

  return (
    <div className="space-y-4">
      <TextControl
        label="Text"
        value={text}
        onChange={(value) => setProp((p) => { p.text = value; })}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Split Position: {splitPosition}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={splitPosition}
          onChange={(e) => setProp((p) => { if (!p.style) p.style = {}; p.style.splitPosition = parseInt(e.target.value) ; })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <ColorControl
            label="First Color"
            value={firstColor}
            onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.firstColor = value ; })}
          />
        </div>
        <div>
          <ColorControl
            label="Second Color"
            value={secondColor}
            onChange={(value) => setProp((p) => { if (!p.style) p.style = {}; p.style.secondColor = value ; })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={fontSize}
          onChange={(e) => setProp((p) => { if (!p.style) p.style = {}; p.style.fontSize = parseInt(e.target.value) ; })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>12px</span>
          <span>{fontSize}px</span>
          <span>120px</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Font Weight</label>
        <select
          value={fontWeight}
          onChange={(e) => setProp((p) => { if (!p.style) p.style = {}; p.style.fontWeight = e.target.value ; })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Light</option>
          <option value="bolder">Bolder</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Line Height: {lineHeight}
        </label>
        <input
          type="range"
          min="0.8"
          max="2.0"
          step="0.1"
          value={lineHeight}
          onChange={(e) => setProp((p) => { if (!p.style) p.style = {}; p.style.lineHeight = parseFloat(e.target.value) ; })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.8</span>
          <span>{lineHeight}</span>
          <span>2.0</span>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div 
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            lineHeight,
            display: 'flex',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ color: firstColor }}>
            {text.substring(0, Math.floor((splitPosition / 100) * text.length))}
          </span>
          <span style={{ color: secondColor }}>
            {text.substring(Math.floor((splitPosition / 100) * text.length))}
          </span>
        </div>
      </div>
    </div>
  );
};

// Craft.js Configuration
DualColorText.craft = {
  displayName: 'Dual Color Text',
  props: {
    text: 'Dual Color Text',
    className: '',
    style: {
      splitPosition: 50,
      firstColor: '#3b82f6',
      secondColor: '#10b981',
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 1.2
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: DualColorTextSettings,
  },
};

export default DualColorText;
