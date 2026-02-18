import { useState, useEffect } from 'react';
import { IoChevronDown, IoChevronUp, IoClose } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import Loading from '../common/Loading';

export default function FilterSidebar({ filters, setFilters, onClose, isMobile }) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    brands: true,
    sizes: false,
    colors: false,
  });

  const { data: availableFilters, isLoading } = useQuery(
    'productFilters',
    () => productsAPI.getFilters()
  );

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categoryId, checked) => {
    const current = filters.categories || [];
    setFilters({
      ...filters,
      categories: checked
        ? [...current, categoryId]
        : current.filter(id => id !== categoryId)
    });
  };

  const handleBrandChange = (brand, checked) => {
    const current = filters.brands || [];
    setFilters({
      ...filters,
      brands: checked
        ? [...current, brand]
        : current.filter(b => b !== brand)
    });
  };

  const handleSizeToggle = (size) => {
    const current = filters.sizes || [];
    const exists = current.includes(size);
    setFilters({
      ...filters,
      sizes: exists
        ? current.filter(s => s !== size)
        : [...current, size]
    });
  };

  const handleColorToggle = (color) => {
    const current = filters.colors || [];
    const exists = current.includes(color);
    setFilters({
      ...filters,
      colors: exists
        ? current.filter(c => c !== color)
        : [...current, color]
    });
  };

  const handlePriceChange = (min, max) => {
    setFilters({
      ...filters,
      priceRange: { min, max }
    });
  };

  const handleCustomFilterChange = (key, value, checked) => {
    const current = filters[key] || [];
    setFilters({
      ...filters,
      [key]: checked
        ? [...current, value]
        : current.filter(v => v !== value)
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (isLoading) {
    return (
      <div className="bg-white p-6">
        <Loading text="Loading filters..." />
      </div>
    );
  }

  const FilterSection = ({ title, children, section }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between py-2 font-medium text-gray-900 hover:text-primary transition-colors"
      >
        <span>{title}</span>
        {expandedSections[section] ? <IoChevronUp /> : <IoChevronDown />}
      </button>
      {expandedSections[section] && (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const Checkbox = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 border-2 border-gray-300 focus:ring-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <div className={`bg-white ${isMobile ? 'fixed inset-0 z-50 overflow-y-auto' : 'sticky top-4'}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold">Filters</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100">
            <IoClose size={24} />
          </button>
        </div>
      )}

      <div className="p-6">
        {/* Header with Clear All */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Categories Filter - Always show */}
        {availableFilters?.data?.categories?.length > 0 && (
          <FilterSection title="Categories" section="categories">
            {availableFilters.data.categories.map((category) => (
              <Checkbox
                key={category._id}
                label={`${category.name} (${category.count})`}
                checked={filters.categories?.includes(category._id)}
                onChange={(checked) => handleCategoryChange(category._id, checked)}
              />
            ))}
          </FilterSection>
        )}

        {/* Price Range Filter */}
        {availableFilters?.data?.priceRange && (
          <FilterSection title="Price Range" section="price">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => handlePriceChange(e.target.value, filters.priceRange?.max)}
                  className="w-full px-3 py-2 border-2 border-gray-300 text-sm focus:border-primary focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => handlePriceChange(filters.priceRange?.min, e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="text-xs text-gray-500">
                Range: R{availableFilters.data.priceRange.min} - R{availableFilters.data.priceRange.max}
              </div>
            </div>
          </FilterSection>
        )}

        {/* Brands Filter - Only show if exists */}
        {availableFilters?.data?.brands && availableFilters.data.brands.length > 0 && (
          <FilterSection title="Brands" section="brands">
            {availableFilters.data.brands.map((brand) => (
              <Checkbox
                key={brand.name}
                label={`${brand.name} (${brand.count})`}
                checked={filters.brands?.includes(brand.name)}
                onChange={(checked) => handleBrandChange(brand.name, checked)}
              />
            ))}
          </FilterSection>
        )}

        {/* Sizes Filter - Only show if exists */}
        {availableFilters?.data?.sizes && availableFilters.data.sizes.length > 0 && (
          <FilterSection title="Sizes" section="sizes">
            <div className="flex flex-wrap gap-2">
              {availableFilters.data.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-4 py-2 border-2 text-sm font-medium transition-colors ${
                    filters.sizes?.includes(size)
                      ? 'bg-primary border-primary text-white'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Colors Filter - Only show if exists */}
        {availableFilters?.data?.colors && availableFilters.data.colors.length > 0 && (
          <FilterSection title="Colors" section="colors">
            <div className="flex flex-wrap gap-2">
              {availableFilters.data.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`w-10 h-10 border-2 transition-all ${
                    filters.colors?.includes(color)
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* Custom Filters - Dynamically rendered */}
        {availableFilters?.data?.customFilters && 
          Object.entries(availableFilters.data.customFilters).map(([key, values]) => (
            values.length > 0 && (
              <FilterSection key={key} title={key.replace(/_/g, ' ').toUpperCase()} section={key}>
                {values.map((value) => (
                  <Checkbox
                    key={value}
                    label={value}
                    checked={filters[key]?.includes(value)}
                    onChange={(checked) => handleCustomFilterChange(key, value, checked)}
                  />
                ))}
              </FilterSection>
            )
          ))
        }

        {/* Apply Filters Button (Mobile) */}
        {isMobile && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-primary text-white py-3 px-6 font-medium hover:bg-primary-600 transition-colors"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
}
