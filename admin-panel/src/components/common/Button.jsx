import React from 'react';
import classNames from 'classnames';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className,
  ...props 
}) => {
  const baseClasses = 'font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    success: 'bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white',
    ghost: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-100',
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-6 py-2',
    lg: 'px-8 py-3 text-lg',
  };
  
  const classes = classNames(
    baseClasses,
    variants[variant],
    sizes[size],
    {
      'w-full': fullWidth,
      'opacity-50 cursor-wait': loading,
    },
    className
  );
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;
