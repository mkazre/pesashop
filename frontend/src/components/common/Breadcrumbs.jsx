import { Link } from 'react-router-dom';
import { IoChevronForward, IoHome } from 'react-icons/io5';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center space-x-2 text-sm py-4">
      <Link to="/" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-1">
        <IoHome />
        Home
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <IoChevronForward className="text-gray-400" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="text-gray-600 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
