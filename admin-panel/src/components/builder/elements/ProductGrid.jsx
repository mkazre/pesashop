import React, { useState, useEffect, useMemo } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { productsAPI, categoriesAPI } from '@/services/api';
import { useResponsiveGridProps } from '@/components/builder/utils/useResponsiveGridProps';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { ShoppingCart, Grid3X3, Loader2 } from 'lucide-react';

export const ProductGrid = ({
  dataSource = 'products',
  sourceFilter = 'all',
  categoryId = '',
  sortBy = 'createdAt',
  sortOrder = -1,
  limit = 12,
  columns = 3,
  gap = '16px',
  showImage = true,
  showTitle = true,
  showPrice = true,
  showButton = true,
  responsiveProps = {},
  className = '',
  style = {},
}) => {
  const { effectiveColumns, effectiveGap } = useResponsiveGridProps(columns, gap, responsiveProps);
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

  const queryKey = useMemo(() => JSON.stringify({ dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit }), [dataSource, sourceFilter, categoryId, sortBy, sortOrder, limit]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit, sort: sortBy, order: sortOrder };
        if (sourceFilter === 'featured') params.featured = true;
        if (sourceFilter === 'new') params.sort = 'createdAt';
        if (sourceFilter === 'sale') params.onSale = true;
        if (sourceFilter === 'category' && categoryId) params.category = categoryId;
        const response = await productsAPI.getAll(params);
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

  const sourceLabel = { all: 'All Products', featured: 'Featured', new: 'New Arrivals', sale: 'On Sale', category: 'Category' }[sourceFilter] || sourceFilter;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`product-grid ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ minHeight: '80px', ...style }}
    >
      {/* Admin info bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-t text-xs text-green-700 mb-2">
        <Grid3X3 size={12} />
        <span className="font-medium">Product Grid</span>
        <span className="text-green-500">·</span>
        <span>{sourceLabel}</span>
        <span className="text-green-500">·</span>
        <span>{loading ? 'Loading...' : `${items.length} products`}</span>
      </div>

      {error && (
        <div className="px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">Error: {error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading products...</span>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">No products found.</div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveColumns}, 1fr)`, gap: effectiveGap }}>
          {items.map((product) => {
            const imageUrl = product.featuredImage || product.images?.[0] || '';
            const price = product.salePrice || product.regularPrice || 0;
            const hasSale = product.salePrice && product.salePrice < product.regularPrice;
            return (
              <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {showImage && (
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart size={32} className="opacity-50" />
                      </div>
                    )}
                    {hasSale && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">SALE</span>}
                  </div>
                )}
                <div className="p-3">
                  {showTitle && <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>}
                  {showPrice && (
                    <div className="mb-2">
                      {hasSale ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600">R {product.salePrice.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 line-through">R {product.regularPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold">R {price.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {showButton && (
                    <button className="w-full bg-blue-600 text-white py-1.5 px-3 rounded text-xs hover:bg-blue-700 transition-colors">Add to Cart</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ProductGridSettings = ({ nodeId }) => {
  const { breakpoint } = useBreakpoint();
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);

  const {
    dataSource = 'products', sourceFilter = 'all', categoryId = '', sortBy = 'createdAt',
    sortOrder = -1, limit = 12, columns = 3, gap = '16px',
    showImage = true, showTitle = true, showPrice = true, showButton = true,
  } = nodeProps;

  const updateRP = (key, value) => {
    setProp((p) => {
      if (breakpoint === 'desktop') { p[key] = value; }
      else { if (!p.responsiveProps) p.responsiveProps = {}; if (!p.responsiveProps[breakpoint]) p.responsiveProps[breakpoint] = {}; p.responsiveProps[breakpoint][key] = value; }
    });
  };
  const getRP = (key, fb) => { if (breakpoint === 'desktop') return nodeProps[key] ?? fb; const o = nodeProps.responsiveProps?.[breakpoint]?.[key]; return o !== undefined ? o : (nodeProps[key] ?? fb); };
  const hasRP = (key) => breakpoint !== 'desktop' && nodeProps.responsiveProps?.[breakpoint]?.[key] !== undefined;
  const clearRP = (key) => { setProp((p) => { if (p.responsiveProps?.[breakpoint]) delete p.responsiveProps[breakpoint][key]; }); };

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
      <div className="p-3 bg-green-50 border border-green-200 rounded space-y-3">
        <h4 className="text-sm font-semibold text-green-700">Data Source</h4>
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
        {sourceFilter === 'category' && (
          <div>
            <label className={labelCls}>Category</label>
            <select value={categoryId} onChange={(e) => setProp((p) => { p.categoryId = e.target.value; })} className={selectCls}>
              <option value="">Select a category...</option>
              {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Limit</label><input type="number" value={limit} onChange={(e) => setProp((p) => { p.limit = parseInt(e.target.value) || 12; })} className={inputCls} min={1} max={50} /></div>
          <div><label className={labelCls}>Columns{hasRP('columns') && <button onClick={() => clearRP('columns')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600">✕</button>}</label>
            <select value={getRP('columns', 3)} onChange={(e) => updateRP('columns', parseInt(e.target.value))} className={`${selectCls} ${hasRP('columns') ? 'ring-1 ring-amber-400' : ''}`}>
              {[1, 2, 3, 4, 5, 6].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Gap{hasRP('gap') && <button onClick={() => clearRP('gap')} className="ml-1 text-[9px] text-amber-600 hover:text-red-600">✕</button>}</label><input type="text" value={getRP('gap', '16px')} onChange={(e) => updateRP('gap', e.target.value)} className={`${inputCls} ${hasRP('gap') ? 'ring-1 ring-amber-400' : ''}`} placeholder="16px" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Sort By</label>
            <select value={sortBy} onChange={(e) => setProp((p) => { p.sortBy = e.target.value; })} className={selectCls}>
              <option value="createdAt">Date</option><option value="name">Name</option><option value="regularPrice">Price</option>
            </select>
          </div>
          <div><label className={labelCls}>Order</label>
            <select value={sortOrder} onChange={(e) => setProp((p) => { p.sortOrder = parseInt(e.target.value); })} className={selectCls}>
              <option value={-1}>Newest</option><option value={1}>Oldest</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Display</h4>
        {[['showImage', 'Show Image', showImage], ['showTitle', 'Show Title', showTitle], ['showPrice', 'Show Price', showPrice], ['showButton', 'Show Add to Cart', showButton]].map(([key, label, val]) => (
          <label key={key} className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={val} onChange={(e) => setProp((p) => { p[key] = e.target.checked; })} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
};

ProductGrid.craft = {
  displayName: 'Product Grid',
  props: {
    dataSource: 'products',
    sourceFilter: 'all',
    categoryId: '',
    sortBy: 'createdAt',
    sortOrder: -1,
    limit: 12,
    columns: 3,
    gap: '16px',
    responsiveProps: {},
    showImage: true,
    showTitle: true,
    showPrice: true,
    showButton: true,
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
    canMoveOut: () => true,
  },
  isCanvas: false,
};
