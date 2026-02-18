import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { DynamicDataPicker } from './DynamicDataPicker';
import { isDynamicValue, extractField, getPropType } from './dynamicData';

/**
 * DynamicDataButton — Small icon button placed next to any property input.
 * When clicked, opens the DynamicDataPicker modal.
 * Shows a purple indicator when a dynamic binding is active.
 *
 * @param {string} propName - The property name (e.g. 'content', 'src', 'href')
 * @param {string} currentValue - The current prop value (may be a dynamic token)
 * @param {function} onBind - Called with the token string or '' to clear
 * @param {string} [propType] - Override the auto-detected prop type
 */
export const DynamicDataButton = ({ propName, currentValue = '', onBind, propType }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isBound = isDynamicValue(currentValue);
  const resolvedType = propType || getPropType(propName);

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        title={isBound ? `Dynamic: ${currentValue}` : 'Insert dynamic data'}
        className={`flex-shrink-0 p-1 rounded transition-colors ${
          isBound
            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 ring-1 ring-purple-300'
            : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
        }`}
      >
        <Database size={12} />
      </button>

      <DynamicDataPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onBind}
        propType={resolvedType}
        currentBinding={isBound ? currentValue : ''}
      />
    </>
  );
};

/**
 * DynamicInput — A text input with an integrated dynamic data button.
 * Wraps a standard input with the DynamicDataButton on the right side.
 * When a dynamic binding is active, shows the token instead of allowing editing.
 */
export const DynamicInput = ({
  propName,
  value = '',
  onChange,
  onDynamicBind,
  propType,
  placeholder = '',
  className = '',
  type = 'text',
  ...rest
}) => {
  const isBound = isDynamicValue(value);

  return (
    <div className="flex items-center gap-1">
      {isBound ? (
        <div className="flex-1 px-3 py-2 text-xs bg-purple-50 border border-purple-200 rounded-md text-purple-700 font-mono truncate">
          {value}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className + ' flex-1'}
          {...rest}
        />
      )}
      <DynamicDataButton
        propName={propName}
        currentValue={value}
        onBind={(token) => {
          if (onDynamicBind) {
            onDynamicBind(propName, token);
          } else if (onChange) {
            // Fallback: set the token as the value directly
            onChange({ target: { value: token } });
          }
        }}
        propType={propType}
      />
    </div>
  );
};

export default DynamicDataButton;
