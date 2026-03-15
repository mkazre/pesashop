import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Menu, X } from 'lucide-react';
import { TextControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const BurgerTrigger = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { className = '', style = {} } = resolved;

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

  const [isOpen, setIsOpen] = useState(false);

  const {
    size = 24,
    color = '#000000',
    backgroundColor = 'transparent',
    borderRadius = '4px',
    padding = '8px',
    strokeWidth = 2,
    animation = 'slide',
    duration = 0.3,
    type = 'hamburger'
  } = style;

  const handleClick = () => {
    setIsOpen(!isOpen);
    setProp((p) => { p.isOpen = !isOpen; });
  };

  const renderIcon = () => {
    const iconStyle = {
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
      padding,
      backgroundColor,
      borderRadius,
      transition: `all ${duration}s ease`
    };

    const lineStyle = {
      width: '100%',
      height: `${strokeWidth}px`,
      backgroundColor: color,
      borderRadius: '2px',
      transition: `all ${duration}s ease`,
      transformOrigin: 'center'
    };

    if (type === 'hamburger') {
      return (
        <div style={iconStyle} onClick={handleClick}>
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
            }}
          />
          <div
            style={{
              ...lineStyle,
              opacity: isOpen ? 0 : 1
            }}
          />
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
            }}
          />
        </div>
      );
    }

    if (type === 'cross') {
      return (
        <div style={iconStyle} onClick={handleClick}>
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(45deg)' : 'none'
            }}
          />
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(-45deg)' : 'none'
            }}
          />
        </div>
      );
    }

    if (type === 'arrow') {
      return (
        <div style={iconStyle} onClick={handleClick}>
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(45deg)' : 'none',
              width: '60%',
              marginLeft: '20%'
            }}
          />
          <div
            style={{
              ...lineStyle,
              transform: isOpen ? 'rotate(-45deg)' : 'none',
              width: '60%',
              marginLeft: '-20%'
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`burger-trigger ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'inline-block' }}
    >
      {renderIcon()}
    </div>
  );
};

// Settings Panel Component
export const BurgerTriggerSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    size = 24,
      color = '#000000',
      backgroundColor = 'transparent',
      borderRadius = '4px',
      padding = '8px',
      strokeWidth = 2,
      animation = 'slide',
      duration = 0.3,
      type = 'hamburger',
      isOpen = false,
      onClickAction = 'toggle'
  } = nodeProps;

  const typeOptions = [
    { value: 'hamburger', label: 'Hamburger' },
    { value: 'cross', label: 'Cross' },
    { value: 'arrow', label: 'Arrow' }
  ];

  const animationOptions = [
    { value: 'slide', label: 'Slide' },
    { value: 'fade', label: 'Fade' },
    { value: 'scale', label: 'Scale' },
    { value: 'rotate', label: 'Rotate' }
  ];

  const actionOptions = [
    { value: 'toggle', label: 'Toggle' },
    { value: 'open', label: 'Open Only' },
    { value: 'close', label: 'Close Only' }
  ];

  return (
    <div className="space-y-4">
      <SelectControl
        label="Icon Type"
        value={type}
        onChange={(value) => setProp((p) => { p.type = value; })}
        options={typeOptions}
      />

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Appearance</h4>

        <NumberControl
          label="Size (px)"
          value={size}
          onChange={(value) => setProp((p) => { p.size = value; })}
          min={16}
          max={48}
        />

        <NumberControl
          label="Stroke Width (px)"
          value={strokeWidth}
          onChange={(value) => setProp((p) => { p.strokeWidth = value; })}
          min={1}
          max={6}
        />

        <div className="grid grid-cols-2 gap-4">
          <ColorControl
            label="Color"
            value={color}
            onChange={(value) => setProp((p) => { p.color = value; })}
          />

          <ColorControl
            label="Background"
            value={backgroundColor}
            onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
          />
        </div>

        <NumberControl
          label="Border Radius (px)"
          value={borderRadius}
          onChange={(value) => setProp((p) => { p.borderRadius = `${value}px`; })}
          min={0}
          max={50}
        />

        <NumberControl
          label="Padding (px)"
          value={padding}
          onChange={(value) => setProp((p) => { p.padding = `${value}px`; })}
          min={0}
          max={20}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Animation</h4>

        <SelectControl
          label="Animation Type"
          value={animation}
          onChange={(value) => setProp((p) => { p.animation = value; })}
          options={animationOptions}
        />

        <NumberControl
          label="Duration (s)"
          value={duration}
          onChange={(value) => setProp((p) => { p.duration = value; })}
          min={0.1}
          max={2}
          step={0.1}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Behavior</h4>

        <SelectControl
          label="Click Action"
          value={onClickAction}
          onChange={(value) => setProp((p) => { p.onClickAction = value; })}
          options={actionOptions}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Initial State</label>
          <select
            value={isOpen ? 'open' : 'closed'}
            onChange={(e) => setProp((p) => { p.isOpen = e.target.value === 'open'; })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div className="flex items-center justify-center p-4 bg-white rounded border">
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: `${padding}px`,
              backgroundColor,
              borderRadius: `${borderRadius}px`,
              transition: `all ${duration}s ease`
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${strokeWidth}px`,
                backgroundColor: color,
                borderRadius: '2px',
                transition: `all ${duration}s ease`,
                transformOrigin: 'center'
              }}
            />
            <div
              style={{
                width: '100%',
                height: `${strokeWidth}px`,
                backgroundColor: color,
                borderRadius: '2px',
                transition: `all ${duration}s ease`
              }}
            />
            <div
              style={{
                width: '100%',
                height: `${strokeWidth}px`,
                backgroundColor: color,
                borderRadius: '2px',
                transition: `all ${duration}s ease`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Craft.js Configuration
BurgerTrigger.craft = {
  displayName: 'Burger Trigger',
  props: {
    className: '',
    style: {
      size: 24,
      color: '#000000',
      backgroundColor: 'transparent',
      borderRadius: '4px',
      padding: '8px',
      strokeWidth: 2,
      animation: 'slide',
      duration: 0.3,
      type: 'hamburger',
      isOpen: false,
      onClickAction: 'toggle'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: BurgerTriggerSettings,
  },
};

export default BurgerTrigger;
