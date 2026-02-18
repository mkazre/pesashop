import { IoRemove, IoAdd } from 'react-icons/io5';

// Variant Selector Component
export function VariantSelector({ variants, selectedVariant, onSelect, type = 'size' }) {
  if (!variants || variants.length === 0) return null;

  if (type === 'color') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Color:</span>
          {selectedVariant && (
            <span className="text-sm text-gray-600">{selectedVariant}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant}
              onClick={() => onSelect(variant)}
              className={`w-10 h-10 border-2 transition-all ${
                selectedVariant === variant
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: variant.toLowerCase() }}
              title={variant}
            />
          ))}
        </div>
      </div>
    );
  }

  // Size or other text variants
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">
          {type.charAt(0).toUpperCase() + type.slice(1)}:
        </span>
        {selectedVariant && (
          <span className="text-sm text-gray-600">{selectedVariant}</span>
        )}
        <button className="text-sm text-primary hover:underline">
          Size Guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant}
            onClick={() => onSelect(variant)}
            className={`px-6 py-2 border-2 font-medium transition-colors ${
              selectedVariant === variant
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            {variant}
          </button>
        ))}
      </div>
    </div>
  );
}

// Quantity Selector Component
export function QuantitySelector({ value, onChange, min = 1, max = 99, stock }) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    const maxAllowed = stock || max;
    if (value < maxAllowed) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || min;
    const maxAllowed = stock || max;
    if (newValue >= min && newValue <= maxAllowed) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-3">
      <span className="font-medium text-gray-900">Quantity:</span>
      <div className="flex items-center gap-0 border-2 border-gray-300 w-fit">
        <button
          onClick={handleDecrease}
          disabled={value <= min}
          className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <IoRemove size={20} />
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="w-16 text-center border-x-2 border-gray-300 py-3 focus:outline-none"
          min={min}
          max={stock || max}
        />
        <button
          onClick={handleIncrease}
          disabled={value >= (stock || max)}
          className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <IoAdd size={20} />
        </button>
      </div>
      {stock && stock < 10 && (
        <p className="text-sm text-orange-600">
          Only {stock} left in stock!
        </p>
      )}
    </div>
  );
}
