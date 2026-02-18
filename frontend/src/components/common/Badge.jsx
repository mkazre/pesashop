export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    sale: 'bg-red-500 text-white',
    new: 'bg-green-500 text-white',
    hot: 'bg-orange-500 text-white',
    stock: 'bg-primary text-white',
    'out-of-stock': 'bg-gray-500 text-white',
    default: 'bg-gray-200 text-gray-800',
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-black',
  };

  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
