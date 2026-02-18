import React, { useState, useEffect, useMemo } from 'react';
import { useNode } from '@craftjs/core';
import { productsAPI, categoriesAPI } from '@/services/api';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { RepeaterItemProvider } from '@/components/builder/utils/RepeaterContext';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { Database, Loader2 } from 'lucide-react';

export const Repeater = ({
  dataSource = 'products',   // 'products' | 'categories'
  sourceFilter = 'all',      // 'all' | 'featured' | 'new' | 'sale' | 'category'
  categoryId = '',
  sortBy = 'createdAt',
  sortOrder = -1,
  limit = 8,
  columns = 4,
  gap = '16px',
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { breakpoint } = useBreakpoint();
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build query params from props
  const queryKey = useMemo(() => JSON.stringify({ dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit }), [dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        if (dataSource === 'products') {
          const params = { limit, sort: sortBy, order: sortOrder };
          if (sourceFilter === 'featured') params.featured = true;
          if (sourceFilter === 'new') params.sort = 'createdAt';
          if (sourceFilter === 'sale') params.onSale = true;
          if (sourceFilter === 'category' && categoryId) params.category = categoryId;
          response = await productsAPI.getAll(params);
        } else if (dataSource === 'categories') {
          response = await categoriesAPI.getAll({ limit });
        }
        if (!cancelled) {
          const list = response?.data?.data || response?.data || [];
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [queryKey]);

  // First item used as preview context for child elements
  const previewItem = items[0] || null;

  // Read responsive overrides for the current breakpoint
  const bpOverrides = (breakpoint !== 'desktop' && responsiveProps[breakpoint]) || {};
  const effectiveColumns = bpOverrides.columns || columns;
  const effectiveGap = bpOverrides.gap || gap;

  const sourceLabel = {
    all: 'All Products',
    featured: 'Featured',
    new: 'New Arrivals',
    sale: 'On Sale',
    category: 'Category',
  }[sourceFilter] || sourceFilter;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`repeater ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ minHeight: '80px', ...style }}
    >
      {/* Admin info bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-t text-xs text-purple-700 mb-2">
        <Database size={12} />
        <span className="font-medium">Repeater</span>
        <span className="text-purple-500">·</span>
        <span>{sourceLabel}</span>
        <span className="text-purple-500">·</span>
        <span>{loading ? 'Loading...' : `${items.length} items`}</span>
        <span className="text-purple-500">·</span>
        <span>{effectiveColumns} cols</span>
      </div>

      {error && (
        <div className="px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading {dataSource}...</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          No {dataSource} found. Check your data source settings.
        </div>
      )}

      {/* Preview: show grid with first item's data applied to the template */}
      {!loading && items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`,
            gap: effectiveGap,
          }}
        >
          {/* First cell: editable canvas with preview data */}
          <RepeaterItemProvider value={previewItem} dataSource={dataSource}>
            <div className="repeater-template border-2 border-dashed border-purple-300 rounded p-1 min-h-[100px]">
              {/* Craft.js canvas children render here */}
            </div>
          </RepeaterItemProvider>

          {/* Remaining cells: ghost previews showing the grid layout */}
          {items.slice(1, effectiveColumns).map((item, i) => (
            <div key={item._id || i} className="repeater-ghost bg-gray-50 border border-dashed border-gray-200 rounded p-3 min-h-[100px] flex items-center justify-center opacity-50">
              <span className="text-xs text-gray-400">{item.name || item.title || `Item ${i + 2}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Repeater.craft = {
  displayName: 'Repeater',
  props: {
    dataSource: 'products',
    sourceFilter: 'all',
    categoryId: '',
    sortBy: 'createdAt',
    sortOrder: -1,
    limit: 8,
    columns: 4,
    gap: '16px',
    responsiveProps: {},
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Repeater'),
    canMoveOut: () => true,
  },
  isCanvas: true,
};
