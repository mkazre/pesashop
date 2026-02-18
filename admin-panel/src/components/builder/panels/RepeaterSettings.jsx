import React, { useState, useEffect } from 'react';
import { useEditor } from '@craftjs/core';
import { categoriesAPI } from '@/services/api';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { Database } from 'lucide-react';

export const RepeaterSettings = ({ nodeId }) => {
  const { breakpoint } = useBreakpoint();
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const {
    dataSource = 'products',
    sourceFilter = 'all',
    categoryId = '',
    sortBy = 'createdAt',
    sortOrder = -1,
    limit = 8,
    columns = 4,
    gap = '16px',
  } = nodeProps;

  // Responsive-aware helpers for columns/gap
  const updateResponsiveProp = (key, value) => {
    setProp((p) => {
      if (breakpoint === 'desktop') {
        p[key] = value;
      } else {
        if (!p.responsiveProps) p.responsiveProps = {};
        if (!p.responsiveProps[breakpoint]) p.responsiveProps[breakpoint] = {};
        p.responsiveProps[breakpoint][key] = value;
      }
    });
  };
  const getResponsiveProp = (key, fallback) => {
    if (breakpoint === 'desktop') return nodeProps[key] ?? fallback;
    const override = nodeProps.responsiveProps?.[breakpoint]?.[key];
    return override !== undefined ? override : (nodeProps[key] ?? fallback);
  };
  const hasOverride = (key) => breakpoint !== 'desktop' && nodeProps.responsiveProps?.[breakpoint]?.[key] !== undefined;
  const clearOverride = (key) => {
    setProp((p) => { if (p.responsiveProps?.[breakpoint]) delete p.responsiveProps[breakpoint][key]; });
  };

  // Fetch categories for the category picker
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    categoriesAPI.getAll().then((res) => {
      const list = res?.data?.data || res?.data || [];
      setCategories(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';
  const selectCls = 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:border-blue-400 focus:outline-none';
  const inputCls = 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:border-blue-400 focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Data Source */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-700">Data Source</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Source Type</label>
            <select value={dataSource} onChange={(e) => setProp((p) => { p.dataSource = e.target.value; })} className={selectCls}>
              <option value="products">Products</option>
              <option value="categories">Categories</option>
            </select>
          </div>

          {dataSource === 'products' && (
            <div>
              <label className={labelCls}>Filter</label>
              <select value={sourceFilter} onChange={(e) => setProp((p) => { p.sourceFilter = e.target.value; })} className={selectCls}>
                <option value="all">All Products</option>
                <option value="featured">Featured</option>
                <option value="new">New Arrivals</option>
                <option value="sale">On Sale</option>
                <option value="category">By Category</option>
              </select>
            </div>
          )}

          {dataSource === 'products' && sourceFilter === 'category' && (
            <div>
              <label className={labelCls}>Category</label>
              <select value={categoryId} onChange={(e) => setProp((p) => { p.categoryId = e.target.value; })} className={selectCls}>
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Limit</label>
            <input type="number" value={limit} onChange={(e) => setProp((p) => { p.limit = parseInt(e.target.value) || 8; })} className={inputCls} min={1} max={50} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Sort By</label>
              <select value={sortBy} onChange={(e) => setProp((p) => { p.sortBy = e.target.value; })} className={selectCls}>
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="regularPrice">Price</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <select value={sortOrder} onChange={(e) => setProp((p) => { p.sortOrder = parseInt(e.target.value); })} className={selectCls}>
                <option value={-1}>Newest First</option>
                <option value={1}>Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Layout</h4>
        {breakpoint !== 'desktop' && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">
            Editing <strong>{breakpoint}</strong> overrides. Desktop columns: {columns}.
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>
              Columns
              {hasOverride('columns') && (
                <button onClick={() => clearOverride('columns')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <select value={getResponsiveProp('columns', 4)} onChange={(e) => updateResponsiveProp('columns', parseInt(e.target.value))} className={`${selectCls} ${hasOverride('columns') ? 'ring-1 ring-amber-400' : ''}`}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Gap
              {hasOverride('gap') && (
                <button onClick={() => clearOverride('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600" title="Clear override">✕</button>
              )}
            </label>
            <input type="text" value={getResponsiveProp('gap', '16px')} onChange={(e) => updateResponsiveProp('gap', e.target.value)} className={`${inputCls} ${hasOverride('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="16px" />
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How to use the Repeater:</p>
        <p>1. Choose your data source above</p>
        <p>2. Drag <strong>Product Title</strong>, <strong>Product Price</strong>, <strong>Product Images</strong>, or <strong>Product Cart Button</strong> inside the Repeater</p>
        <p>3. These elements will automatically show real product data</p>
        <p>4. On the frontend, the template repeats for each product</p>
      </div>
    </div>
  );
};
