import React from 'react';
import classNames from 'classnames';

const Select = React.forwardRef(({ 
  label, 
  error, 
  helperText,
  required = false,
  fullWidth = false,
  options = [],
  className,
  ...props 
}, ref) => {
  const selectClasses = classNames(
    'input',
    {
      'border-red-500 focus:border-red-500': error,
      'w-full': fullWidth,
    },
    className
  );
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={selectClasses}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
