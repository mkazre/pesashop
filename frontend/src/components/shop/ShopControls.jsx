import { IoGrid, IoList, IoChevronDown } from 'react-icons/io5';

export function SortDropdown({ value, onChange }) {
  const options = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'date-desc', label: 'Newest First' },
    { value: 'rating-desc', label: 'Highest Rated' },
  ];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded px-2 sm:px-4 py-1.5 sm:py-2 pr-7 sm:pr-10 text-xs sm:text-sm focus:border-primary focus:outline-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IoChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={12} />
    </div>
  );
}

export function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 sm:p-2 transition-colors ${
          value === 'grid'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="Grid View"
      >
        <IoGrid size={16} className="sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-1.5 sm:p-2 transition-colors ${
          value === 'list'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="List View"
      >
        <IoList size={16} className="sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
