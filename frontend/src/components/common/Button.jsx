export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth, 
  loading, 
  icon,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white',
    secondary: 'bg-transparent text-secondary border-2 border-secondary hover:bg-secondary hover:text-black',
    'primary-filled': 'bg-primary text-white border-2 border-primary hover:bg-primary-600',
    'secondary-filled': 'bg-secondary text-black border-2 border-secondary hover:bg-secondary-600',
    ghost: 'bg-transparent hover:bg-gray-100',
    danger: 'bg-transparent text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} transition-all duration-200 inline-flex items-center justify-center font-medium ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
