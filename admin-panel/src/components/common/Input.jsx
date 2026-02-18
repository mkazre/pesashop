import React from 'react';
import classNames from 'classnames';

const Input = React.forwardRef(({ 
  label, 
  error, 
  helperText,
  type = 'text',
  required = false,
  fullWidth = false,
  className,
  ...props 
}, ref) => {
  const inputClasses = classNames(
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
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
