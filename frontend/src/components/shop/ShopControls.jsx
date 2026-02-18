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
        className="appearance-none bg-white border-2 border-gray-300 px-4 py-2 pr-10 focus:border-primary focus:outline-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
    </div>
  );
}

export function ViewToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 border-2 border-gray-300">
      <button
        onClick={() => onChange('grid')}
        className={`p-2 transition-colors ${
          value === 'grid'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="Grid View"
      >
        <IoGrid size={20} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 transition-colors ${
          value === 'list'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
        title="List View"
      >
        <IoList size={20} />
      </button>
    </div>
  );
}
