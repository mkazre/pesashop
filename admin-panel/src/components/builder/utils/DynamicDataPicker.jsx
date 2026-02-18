import React, { useState, useMemo } from 'react';
import { X, Search, ShoppingBag, FolderOpen, Globe, Code, Zap, Database } from 'lucide-react';
import { DATA_POINT_CATEGORIES, getDataPointsForType, makeDynamicToken } from './dynamicData';

const ICONS = { ShoppingBag, FolderOpen, Globe, Code };

/**
 * DynamicDataPicker — Modal for selecting a dynamic data source.
 * Inspired by Oxygen Builder's Insert Dynamic Data dialog.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onSelect - Called with the token string, e.g. "{{product.name}}"
 * @param {string} propType - 'text'|'image'|'url'|'number'|'html'|'any'
 * @param {string} currentBinding - Current binding token if any
 */
export const DynamicDataPicker = ({ isOpen, onClose, onSelect, propType = 'any', currentBinding = '' }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [customField, setCustomField] = useState('');

  const compatiblePoints = useMemo(() => getDataPointsForType(propType), [propType]);

  const filtered = useMemo(() => {
    let pts = compatiblePoints;
    if (activeCategory) {
      pts = pts.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      pts = pts.filter(p => p.label.toLowerCase().includes(q) || p.field.toLowerCase().includes(q));
    }
    return pts.filter(p => !p.isCustom);
  }, [compatiblePoints, activeCategory, search]);

  if (!isOpen) return null;

  const handleSelect = (field) => {
    onSelect(makeDynamicToken(field));
    onClose();
  };

  const handleCustomField = () => {
    if (customField.trim()) {
      onSelect(makeDynamicToken(`custom.${customField.trim()}`));
      onClose();
    }
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-[520px] max-h-[600px] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900">Insert Dynamic Data</h3>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
              {propType}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search data points..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              !activeCategory ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {DATA_POINT_CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.icon] || Zap;
            const hasCompatible = compatiblePoints.some(p => p.category === cat.id && !p.isCustom);
            if (!hasCompatible && cat.id !== 'custom') return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat.id ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Data points list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {filtered.length === 0 && !activeCategory?.startsWith('custom') && (
            <div className="py-8 text-center text-gray-400 text-sm">
              No data points match your search.
            </div>
          )}

          {/* Group by category */}
          {DATA_POINT_CATEGORIES.map((cat) => {
            const catPoints = filtered.filter(p => p.category === cat.id);
            if (catPoints.length === 0 && cat.id !== 'custom') return null;
            if (activeCategory && activeCategory !== cat.id) return null;

            const Icon = ICONS[cat.icon] || Zap;
            return (
              <div key={cat.id} className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <Icon size={12} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.label}</span>
                </div>
                {catPoints.map((point) => {
                  const isActive = currentBinding === makeDynamicToken(point.field);
                  return (
                    <button
                      key={point.field}
                      onClick={() => handleSelect(point.field)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors mb-0.5 ${
                        isActive
                          ? 'bg-purple-100 border border-purple-300 text-purple-800'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">{point.label}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{`{{${point.field}}}`}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        point.type === 'text' ? 'bg-blue-50 text-blue-600' :
                        point.type === 'image' ? 'bg-green-50 text-green-600' :
                        point.type === 'url' ? 'bg-amber-50 text-amber-600' :
                        point.type === 'number' ? 'bg-pink-50 text-pink-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {point.type}
                      </span>
                    </button>
                  );
                })}

                {/* Custom field input */}
                {cat.id === 'custom' && (activeCategory === 'custom' || !activeCategory) && (
                  <div className="flex gap-2 mt-2 px-1">
                    <input
                      type="text"
                      value={customField}
                      onChange={(e) => setCustomField(e.target.value)}
                      placeholder="Enter custom field key..."
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomField()}
                    />
                    <button
                      onClick={handleCustomField}
                      disabled={!customField.trim()}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Insert
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-[10px] text-gray-400">
            {currentBinding ? (
              <span>Current: <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">{currentBinding}</code></span>
            ) : (
              'No dynamic binding set'
            )}
          </div>
          <div className="flex gap-2">
            {currentBinding && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Remove Binding
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicDataPicker;
