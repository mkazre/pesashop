import { Link } from 'react-router-dom';
import { IoCloseCircle, IoGitCompare } from 'react-icons/io5';
import { useCompareStore } from '@/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getImageSrc(path) {
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

export default function FloatingCompareBar({ settings = {} }) {
  const { items, removeItem, clearCompare } = useCompareStore();
  const compare = settings?.compare || {};

  if (!compare.enabled || items.length === 0) return null;

  const position = compare.floatingBarPosition || 'bottom';
  const maxItems = compare.maxItems || 4;

  return (
    <div
      className={`fixed z-50 bg-white border-t-2 border-gray-200 shadow-2xl transition-all duration-300 ${
        position === 'bottom-right'
          ? 'bottom-4 right-4 rounded-xl max-w-sm'
          : 'bottom-0 left-0 right-0'
      }`}
    >
      <div className={`${position === 'bottom-right' ? 'p-4' : 'container-custom py-3'}`}>
        <div className="flex items-center gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <IoGitCompare size={20} className="text-primary" />
            <span className="text-sm font-semibold text-gray-700">
              Compare ({items.length}/{maxItems})
            </span>
          </div>

          {/* Product thumbnails */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {items.map((item) => (
              <div key={item._id} className="relative flex-shrink-0 group/thumb">
                <img
                  src={getImageSrc(item.featuredImage || item.images?.[0])}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded border border-gray-200"
                />
                <button
                  onClick={() => removeItem(item._id)}
                  className="absolute -top-1.5 -right-1.5 text-gray-400 hover:text-red-500 bg-white rounded-full shadow opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                >
                  <IoCloseCircle size={18} />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none">
                  {item.name}
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: maxItems - items.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-300 flex-shrink-0">
                <span className="text-lg">+</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/compare"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition-colors"
            >
              Compare Now
            </Link>
            <button
              onClick={clearCompare}
              className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
