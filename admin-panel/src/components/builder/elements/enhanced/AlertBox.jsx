import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { TextControl, NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';

export const AlertBox = ({ type = 'info', title = 'Alert Title', message = 'Alert message', className = '', style = {} }) => {
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

  const getAlertStyles = () => {
    const baseStyles = {
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      transition: 'all 0.3s ease'
    };

    const typeStyles = {
      info: {
        backgroundColor: style.backgroundColor || '#dbeafe',
        borderColor: style.borderColor || '#3b82f6',
        color: style.textColor || '#1e40af'
      },
      success: {
        backgroundColor: style.backgroundColor || '#d1fae5',
        borderColor: style.borderColor || '#10b981',
        color: style.textColor || '#065f46'
      },
      warning: {
        backgroundColor: style.backgroundColor || '#fef3c7',
        borderColor: style.borderColor || '#f59e0b',
        color: style.textColor || '#92400e'
      },
      error: {
        backgroundColor: style.backgroundColor || '#fee2e2',
        borderColor: style.borderColor || '#ef4444',
        color: style.textColor || '#991b1b'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type];
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`alert-box ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={getAlertStyles()}
    >
      <div className="alert-icon text-xl" style={{ fontSize: style.iconSize || '20px' }}>
        {getIcon()}
      </div>
      <div className="alert-content flex-1">
        {title && (
          <h4 className="alert-title font-semibold mb-1" style={{ fontSize: style.titleFontSize || '16px' }}>
            {title}
          </h4>
        )}
        <p className="alert-message text-sm" style={{ fontSize: style.messageFontSize || '14px' }}>
          {message}
        </p>
      </div>
      {style.showCloseButton && (
        <button
          className="alert-close text-gray-500 hover:text-gray-700"
          style={{ fontSize: style.closeButtonSize || '16px' }}
          onClick={() => {
            // Handle close action
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// Settings Panel Component
export const AlertBoxSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    type = 'info',
      title = 'Alert Title',
      message = 'Alert message',
      backgroundColor,
      borderColor,
      textColor,
      iconSize = 20,
      titleFontSize = 16,
      messageFontSize = 14,
      closeButtonSize = 16,
      showCloseButton = false,
      autoClose = false,
      autoCloseDelay = 5000
  } = nodeProps;

  const alertTypes = [
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' }
  ];

  return (
    <div className="space-y-4">
      <SelectControl
        label="Alert Type"
        value={type}
        onChange={(value) => setProp((p) => { p.type = value; })}
        options={alertTypes}
      />

      <TextControl
        label="Title"
        value={title}
        onChange={(value) => setProp((p) => { p.title = value; })}
        placeholder="Alert title (optional)"
      />

      <TextControl
        label="Message"
        value={message}
        onChange={(value) => setProp((p) => { p.message = value; })}
        multiline
        placeholder="Alert message"
      />

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Colors</h4>

        <ColorControl
          label="Background Color"
          value={backgroundColor}
          onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
        />

        <ColorControl
          label="Border Color"
          value={borderColor}
          onChange={(value) => setProp((p) => { p.borderColor = value; })}
        />

        <ColorControl
          label="Text Color"
          value={textColor}
          onChange={(value) => setProp((p) => { p.textColor = value; })}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Typography</h4>

        <NumberControl
          label="Icon Size (px)"
          value={iconSize}
          onChange={(value) => setProp((p) => { p.iconSize = value; })}
          min={12}
          max={32}
        />

        <NumberControl
          label="Title Font Size (px)"
          value={titleFontSize}
          onChange={(value) => setProp((p) => { p.titleFontSize = value; })}
          min={12}
          max={24}
        />

        <NumberControl
          label="Message Font Size (px)"
          value={messageFontSize}
          onChange={(value) => setProp((p) => { p.messageFontSize = value; })}
          min={10}
          max={20}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Behavior</h4>

        <Checkbox
          label="Show Close Button"
          checked={showCloseButton}
          onChange={(checked) => setProp((p) => { p.showCloseButton = checked; })}
        />

        {showCloseButton && (
          <NumberControl
            label="Close Button Size (px)"
            value={closeButtonSize}
            onChange={(value) => setProp((p) => { p.closeButtonSize = value; })}
            min={12}
            max={24}
          />
        )}

        <Checkbox
          label="Auto Close"
          checked={autoClose}
          onChange={(checked) => setProp((p) => { p.autoClose = checked; })}
        />

        {autoClose && (
          <NumberControl
            label="Auto Close Delay (ms)"
            value={autoCloseDelay}
            onChange={(value) => setProp((p) => { p.autoCloseDelay = value; })}
            min={1000}
            max={10000}
            step={500}
          />
        )}
      </div>
    </div>
  );
};

// Craft.js Configuration
AlertBox.craft = {
  displayName: 'Alert Box',
  props: {
    type: 'info',
    title: 'Alert Title',
    message: 'Alert message',
    className: '',
    style: {},
    backgroundColor: null,
    borderColor: null,
    textColor: null,
    iconSize: 20,
    titleFontSize: 16,
    messageFontSize: 14,
    closeButtonSize: 16,
    showCloseButton: false,
    autoClose: false,
    autoCloseDelay: 5000,
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: AlertBoxSettings,
  },
};

export default AlertBox;
