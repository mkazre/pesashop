import React from 'react';
import classNames from 'classnames';

const Checkbox = React.forwardRef(({ 
  label, 
  error, 
  helperText,
  required = false,
  fullWidth = false,
  className,
  ...props 
}, ref) => {
  const checkboxClasses = classNames(
    'w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2',
    {
      'border-red-500': error,
    },
    className
  );
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {helperText && (
              <p className="text-gray-500 mt-1">{helperText}</p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !label && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
