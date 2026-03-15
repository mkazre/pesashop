import { useState, useMemo } from 'react';
import { IoChevronDown, IoChevronUp, IoStarSharp } from 'react-icons/io5';
import { useQuery } from 'react-query';
import { productsAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import Loading from '../common/Loading';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
function getImageSrc(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export default function FilterSidebar({ filters, setFilters, onClose, isMobile, settings = {}, currentCategoryId }) {
  const { formatPrice } = useCurrencyStore();
  const sb = settings?.sidebar || {};
  const widgets = sb.widgets || [];

  // Determine initial expanded state from settings widgets
  const initialExpanded = useMemo(() => {
    const expanded = { categories: true, priceRange: true, brands: true, sizes: false, colors: false, rating: false, tags: false };
    widgets.forEach(w => { if (w.id && w.enabled) expanded[w.id] = !w.collapsed; });
    return expanded;
  }, [widgets]);

  const [expandedSections, setExpandedSections] = useState(initialExpanded);

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

  // Helper: check if a widget is enabled
  const isWidgetEnabled = (widgetId) => {
    if (!widgets.length) return true; // default all on if no widget config
    const widget = widgets.find(w => w.id === widgetId);
    return widget ? widget.enabled : false;
  };

  // Rating filter handler
  const handleRatingChange = (minRating) => {
    setFilters({ ...filters, minRating: filters.minRating === minRating ? undefined : minRating });
  };

  return (
    <div className={`bg-white ${isMobile ? '' : ''}`} style={{ background: settings?.theme?.sidebarBackground || '#ffffff' }}>
      <div className="p-5">
        {/* Header with Clear All */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Categories Filter */}
        {isWidgetEnabled('categories') && availableFilters?.data?.categories?.length > 0 && (
          <FilterSection title="Categories" section="categories">
            {availableFilters.data.categories.map((category) => (
              <div key={category._id} className="flex items-center gap-2">
                {sb.showCategoryIcon && category.iconImage?.url && (
                  <img src={getImageSrc(category.iconImage.url)} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                )}
                <Checkbox
                  label={`${category.name}${sb.showCategoryCount !== false ? ` (${category.count})` : ''}`}
                  checked={filters.categories?.includes(category._id) || category._id === currentCategoryId}
                  onChange={(checked) => handleCategoryChange(category._id, checked)}
                />
              </div>
            ))}
          </FilterSection>
        )}

        {/* Price Range Filter */}
        {isWidgetEnabled('priceRange') && availableFilters?.data?.priceRange && (
          <FilterSection title="Price Range" section="priceRange">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => handlePriceChange(e.target.value, filters.priceRange?.max)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-primary focus:outline-none"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => handlePriceChange(filters.priceRange?.min, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="text-xs text-gray-500">
                Range: {formatPrice(availableFilters.data.priceRange.min)} – {formatPrice(availableFilters.data.priceRange.max)}
              </div>
            </div>
          </FilterSection>
        )}

        {/* Brands Filter */}
        {isWidgetEnabled('brands') && availableFilters?.data?.brands?.length > 0 && (
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

        {/* Rating Filter */}
        {isWidgetEnabled('rating') && (
          <FilterSection title="Rating" section="rating">
            <div className="space-y-1">
              {[4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${
                    filters.minRating === star ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IoStarSharp key={i} size={14} className={i < star ? 'text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">& up</span>
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Sizes Filter */}
        {isWidgetEnabled('sizes') && availableFilters?.data?.sizes?.length > 0 && (
          <FilterSection title="Sizes" section="sizes">
            <div className="flex flex-wrap gap-2">
              {availableFilters.data.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`px-3 py-1.5 border text-xs font-medium transition-colors rounded ${
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

        {/* Colors Filter */}
        {isWidgetEnabled('colors') && availableFilters?.data?.colors?.length > 0 && (
          <FilterSection title="Colors" section="colors">
            <div className="flex flex-wrap gap-2">
              {availableFilters.data.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorToggle(color)}
                  className={`w-8 h-8 border-2 transition-all rounded-full ${
                    filters.colors?.includes(color)
                      ? 'border-primary ring-2 ring-primary ring-offset-1'
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
              <FilterSection key={key} title={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} section={key}>
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

        {/* Sidebar Promo Banner */}
        {sb.sidebarBannerImage && isWidgetEnabled('sidebarBanner') && (
          <div className="mt-4">
            {sb.sidebarBannerLink ? (
              <a href={sb.sidebarBannerLink} target="_blank" rel="noopener noreferrer">
                <img src={getImageSrc(sb.sidebarBannerImage)} alt={sb.sidebarBannerText || ''} className="w-full rounded-lg" />
              </a>
            ) : (
              <img src={getImageSrc(sb.sidebarBannerImage)} alt={sb.sidebarBannerText || ''} className="w-full rounded-lg" />
            )}
            {sb.sidebarBannerText && (
              <p className="text-xs text-gray-500 mt-1 text-center">{sb.sidebarBannerText}</p>
            )}
          </div>
        )}

        {/* Apply Filters Button (Mobile) */}
        {isMobile && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-primary text-white py-3 px-6 font-medium rounded hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
}
