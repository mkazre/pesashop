import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { TextControl, ColorControl, SelectControl } from '@/components/builder/controls/PropertyControls';

export const DualButton = ({ className = '', style = {} }) => {
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [activeButton, setActiveButton] = useState('primary');

  const handleButtonClick = (buttonType) => {
    setActiveButton(buttonType);
    setProp((p) => { p.activeButton = buttonType; });
  };

  const getButtonStyle = (buttonType) => {
    const isActive = activeButton === buttonType;
    const baseStyle = {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    };

    if (buttonType === 'primary') {
      return {
        ...baseStyle,
        backgroundColor: isActive ? (style.primaryBgColor || '#3b82f6') : (style.primaryBgColorInactive || '#e5e7eb'),
        color: isActive ? (style.primaryTextColor || '#ffffff') : (style.primaryTextColorInactive || '#6b7280'),
        border: isActive ? 'none' : `1px solid ${style.primaryBorderColor || '#d1d5db'}`
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: isActive ? (style.secondaryBgColor || '#10b981') : (style.secondaryBgColorInactive || '#e5e7eb'),
        color: isActive ? (style.secondaryTextColor || '#ffffff') : (style.secondaryTextColorInactive || '#6b7280'),
        border: isActive ? 'none' : `1px solid ${style.secondaryBorderColor || '#d1d5db'}`
      };
    }
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`dual-button-container inline-flex ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ ...style, gap: '12px' }}
    >
      {/* Primary Button */}
      <button
        style={getButtonStyle('primary')}
        onClick={() => handleButtonClick('primary')}
        className="dual-button-primary"
      >
        {style.primaryIcon === 'arrow' && <ArrowRight size={16} />}
        {style.primaryIcon === 'chevron' && <ChevronRight size={16} />}
        {style.primaryText || 'Primary Action'}
      </button>

      {/* Secondary Button */}
      <button
        style={getButtonStyle('secondary')}
        onClick={() => handleButtonClick('secondary')}
        className="dual-button-secondary"
      >
        {style.secondaryIcon === 'arrow' && <ArrowRight size={16} />}
        {style.secondaryIcon === 'chevron' && <ChevronRight size={16} />}
        {style.secondaryText || 'Secondary Action'}
      </button>
    </div>
  );
};

// Settings Panel Component
export const DualButtonSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    activeButton = 'primary',
      primaryText = 'Primary Action',
      secondaryText = 'Secondary Action',
      primaryIcon = 'arrow',
      secondaryIcon = 'arrow',
      primaryBgColor = '#3b82f6',
      primaryTextColor = '#ffffff',
      primaryBorderColor = '#d1d5db',
      primaryBgColorInactive = '#e5e7eb',
      primaryTextColorInactive = '#6b7280',
      secondaryBgColor = '#10b981',
      secondaryTextColor = '#ffffff',
      secondaryBorderColor = '#d1d5db',
      secondaryBgColorInactive = '#e5e7eb',
      secondaryTextColorInactive = '#6b7280'
  } = nodeProps;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Primary Button</h4>
        
        <TextControl
          label="Text"
          value={primaryText}
          onChange={(value) => setProp((p) => { p.primaryText = value; })}
        />

        <SelectControl
          label="Icon"
          value={primaryIcon}
          onChange={(value) => setProp((p) => { p.primaryIcon = value; })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'arrow', label: 'Arrow' },
            { value: 'chevron', label: 'Chevron' }
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active State</label>
            <ColorControl
              label="Background"
              value={primaryBgColor}
              onChange={(value) => setProp((p) => { p.primaryBgColor = value; })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inactive State</label>
            <ColorControl
              label="Background"
              value={primaryBgColorInactive}
              onChange={(value) => setProp((p) => { p.primaryBgColorInactive = value; })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <ColorControl
              label="Active Text"
              value={primaryTextColor}
              onChange={(value) => setProp((p) => { p.primaryTextColor = value; })}
            />
          </div>
          <div>
            <ColorControl
              label="Inactive Text"
              value={primaryTextColorInactive}
              onChange={(value) => setProp((p) => { p.primaryTextColorInactive = value; })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Secondary Button</h4>
        
        <TextControl
          label="Text"
          value={secondaryText}
          onChange={(value) => setProp((p) => { p.secondaryText = value; })}
        />

        <SelectControl
          label="Icon"
          value={secondaryIcon}
          onChange={(value) => setProp((p) => { p.secondaryIcon = value; })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'arrow', label: 'Arrow' },
            { value: 'chevron', label: 'Chevron' }
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active State</label>
            <ColorControl
              label="Background"
              value={secondaryBgColor}
              onChange={(value) => setProp((p) => { p.secondaryBgColor = value; })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inactive State</label>
            <ColorControl
              label="Background"
              value={secondaryBgColorInactive}
              onChange={(value) => setProp((p) => { p.secondaryBgColorInactive = value; })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <ColorControl
              label="Active Text"
              value={secondaryTextColor}
              onChange={(value) => setProp((p) => { p.secondaryTextColor = value; })}
            />
          </div>
          <div>
            <ColorControl
              label="Inactive Text"
              value={secondaryTextColorInactive}
              onChange={(value) => setProp((p) => { p.secondaryTextColorInactive = value; })}
            />
          </div>
        </div>
      </div>

      <SelectControl
        label="Default Active Button"
        value={activeButton}
        onChange={(value) => setProp((p) => { p.activeButton = value; })}
        options={[
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' }
        ]}
      />
    </div>
  );
};

// Craft.js Configuration
DualButton.craft = {
  displayName: 'Dual Button',
  props: {
    className: '',
    style: {},
    activeButton: 'primary',
    primaryText: 'Primary Action',
    secondaryText: 'Secondary Action',
    primaryIcon: 'arrow',
    secondaryIcon: 'arrow',
    primaryBgColor: '#3b82f6',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#d1d5db',
    primaryBgColorInactive: '#e5e7eb',
    primaryTextColorInactive: '#6b7280',
    secondaryBgColor: '#10b981',
    secondaryTextColor: '#ffffff',
    secondaryBorderColor: '#d1d5db',
    secondaryBgColorInactive: '#e5e7eb',
    secondaryTextColorInactive: '#6b7280',
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: DualButtonSettings,
  },
};

export default DualButton;
