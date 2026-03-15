import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productArchiveSettingsAPI, imagesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  IoChevronDown,
  IoChevronUp,
  IoSaveOutline,
  IoRefreshOutline,
  IoAddCircleOutline,
  IoTrashOutline,
} from 'react-icons/io5';

// ── Helpers (same pattern as ProductPageSettingsPage) ─────────────────────────

function Toggle({ label, sublabel, checked, onChange, disabled }) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${disabled ? 'opacity-50' : ''}`}>
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="sr-only" />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-gray-300'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</span>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </label>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, min, max, options, rows, sublabel }) {
  if (type === 'select') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        {sublabel && <p className="text-xs text-gray-400 mb-1">{sublabel}</p>}
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-green-500 focus:outline-none">
          {options?.map(o => <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>{typeof o === 'object' ? o.label : o}</option>)}
        </select>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-green-500 focus:outline-none" />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {sublabel && <p className="text-xs text-gray-400 mb-1">{sublabel}</p>}
      <input type={type} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder} min={min} max={max} className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-green-500 focus:outline-none" />
    </div>
  );
}

function Section({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 mb-3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <IoChevronUp className="text-gray-400" /> : <IoChevronDown className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">{children}</div>}
    </div>
  );
}

function ListEditor({ items = [], onChange, fields, addLabel = 'Add item' }) {
  const handleAdd = () => {
    const newItem = {};
    fields.forEach(f => { newItem[f.key] = f.default || ''; });
    newItem.enabled = true;
    newItem.order = items.length;
    onChange([...items, newItem]);
  };
  const handleRemove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const handleChange = (idx, key, val) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [key]: val };
    onChange(updated);
  };
  const moveItem = (idx, dir) => {
    const updated = [...items];
    const target = idx + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    updated.forEach((item, i) => { item.order = i; });
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200">
          <div className="flex flex-col gap-1 pt-1">
            <button onClick={() => moveItem(idx, -1)} className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
            <button onClick={() => moveItem(idx, 1)} className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500">{f.label}</label>
                {f.type === 'toggle' ? (
                  <Toggle label="" checked={item[f.key] ?? true} onChange={(v) => handleChange(idx, f.key, v)} />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={item[f.key] || ''}
                    onChange={(e) => handleChange(idx, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 text-xs"
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => handleRemove(idx)} className="p-1 text-red-400 hover:text-red-600 mt-1"><IoTrashOutline size={16} /></button>
        </div>
      ))}
      <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 transition-colors">
        <IoAddCircleOutline size={14} /> {addLabel}
      </button>
    </div>
  );
}

function StringListEditor({ items = [], onChange, label = 'Add item', placeholder = '' }) {
  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input type="text" value={item} onChange={(e) => { const u = [...items]; u[idx] = e.target.value; onChange(u); }} className="flex-1 px-2 py-1 border border-gray-300 text-xs" placeholder={placeholder} />
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><IoTrashOutline size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50">
        <IoAddCircleOutline size={14} /> {label}
      </button>
    </div>
  );
}

function ImageUploadField({ label, sublabel, value, onChange }) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const handleUpload = async (file) => {
    try {
      const res = await imagesAPI.upload(file);
      const url = res.data?.url || res.data?.data?.url || '';
      onChange(url);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
  };
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {sublabel && <p className="text-xs text-gray-400 mb-1">{sublabel}</p>}
      <div className="flex items-center gap-3">
        {value && (
          <img src={value.startsWith('http') ? value : `${API_BASE}${value}`} alt="" className="w-16 h-10 object-cover border border-gray-200 rounded" />
        )}
        <label className="px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 cursor-pointer transition-colors">
          {value ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
        </label>
        {value && <button onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProductArchiveSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { isLoading, error } = useQuery('productArchiveSettings', () => productArchiveSettingsAPI.get(), {
    onSuccess: (res) => {
      if (!settings) setSettings(res.data?.data || res.data || {});
    },
  });

  const saveMutation = useMutation((data) => productArchiveSettingsAPI.update(data), {
    onSuccess: (res) => {
      setSettings(res.data?.data || res.data || settings);
      setDirty(false);
      queryClient.invalidateQueries('productArchiveSettings');
      toast.success('Archive settings saved!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const resetMutation = useMutation(() => productArchiveSettingsAPI.reset(), {
    onSuccess: (res) => {
      setSettings(res.data?.data || res.data || {});
      setDirty(false);
      queryClient.invalidateQueries('productArchiveSettings');
      toast.success('Settings reset to defaults');
    },
  });

  const s = settings || {};

  const update = (section, key, value) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setDirty(true);
  };

  const updateRoot = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  if (error || !settings) return <div className="p-8 text-center text-red-500">Failed to load settings</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Archive Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure the shop page, category archive, and search results layout</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (confirm('Reset all settings to defaults?')) resetMutation.mutate(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <IoRefreshOutline size={16} /> Reset
          </button>
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={!dirty || saveMutation.isLoading}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white transition-colors ${dirty ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            <IoSaveOutline size={16} /> {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ─── LAYOUT ─────────────────────────────────────────────────────── */}
      <Section title="Layout" subtitle="Overall page layout structure" defaultOpen>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Layout Type" type="select" value={s.layout?.type} onChange={(v) => update('layout', 'type', v)}
            options={[{ value: 'sidebar-left', label: 'Sidebar Left' }, { value: 'sidebar-right', label: 'Sidebar Right' }, { value: 'full-width', label: 'Full Width' }]} />
          <Field label="Sidebar Width" type="text" value={s.layout?.sidebarWidth} onChange={(v) => update('layout', 'sidebarWidth', v)} placeholder="280px" />
          <Field label="Content Gap (px)" type="number" value={s.layout?.contentGap} onChange={(v) => update('layout', 'contentGap', v)} min={0} max={48} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Container Max Width" type="text" value={s.layout?.containerMaxWidth} onChange={(v) => update('layout', 'containerMaxWidth', v)} />
          <div className="pt-5"><Toggle label="Sticky Filters Sidebar" checked={s.layout?.stickyFilters} onChange={(v) => update('layout', 'stickyFilters', v)} /></div>
        </div>
      </Section>

      {/* ─── PAGE HEADER / BANNER ───────────────────────────────────────── */}
      <Section title="Page Header & Category Banner" subtitle="Banner shown at top of archive pages">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Page Header" checked={s.pageHeader?.enabled} onChange={(v) => update('pageHeader', 'enabled', v)} />
          <Toggle label="Show Breadcrumbs" checked={s.pageHeader?.showBreadcrumbs} onChange={(v) => update('pageHeader', 'showBreadcrumbs', v)} />
          <Toggle label="Show Page Title" checked={s.pageHeader?.showTitle} onChange={(v) => update('pageHeader', 'showTitle', v)} />
          <Toggle label="Show Product Count" checked={s.pageHeader?.showProductCount} onChange={(v) => update('pageHeader', 'showProductCount', v)} />
          <Toggle label="Show Description" checked={s.pageHeader?.showDescription} onChange={(v) => update('pageHeader', 'showDescription', v)} />
          <Toggle label="Show Category Banner" sublabel="Landscape banner on category pages" checked={s.pageHeader?.showCategoryBanner} onChange={(v) => update('pageHeader', 'showCategoryBanner', v)} />
        </div>
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Banner Styling</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Banner Height" type="text" value={s.pageHeader?.bannerHeight} onChange={(v) => update('pageHeader', 'bannerHeight', v)} placeholder="220px" />
          <Field label="Overlay Color" type="text" value={s.pageHeader?.bannerOverlayColor} onChange={(v) => update('pageHeader', 'bannerOverlayColor', v)} placeholder="rgba(0,0,0,0.45)" />
          <Field label="Text Color" type="text" value={s.pageHeader?.bannerTextColor} onChange={(v) => update('pageHeader', 'bannerTextColor', v)} placeholder="#ffffff" />
          <Field label="Title Font Size (px)" type="number" value={s.pageHeader?.bannerTitleSize} onChange={(v) => update('pageHeader', 'bannerTitleSize', v)} />
          <Field label="Description Font Size (px)" type="number" value={s.pageHeader?.bannerDescriptionSize} onChange={(v) => update('pageHeader', 'bannerDescriptionSize', v)} />
        </div>
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Default Shop Page Banner</h4>
        <ImageUploadField label="Default Banner Image" sublabel="Shown on the main shop page when no category is selected" value={s.pageHeader?.defaultBannerImage} onChange={(v) => update('pageHeader', 'defaultBannerImage', v)} />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Default Banner Title" type="text" value={s.pageHeader?.defaultBannerTitle} onChange={(v) => update('pageHeader', 'defaultBannerTitle', v)} />
          <Field label="Default Banner Description" type="text" value={s.pageHeader?.defaultBannerDescription} onChange={(v) => update('pageHeader', 'defaultBannerDescription', v)} />
        </div>
      </Section>

      {/* ─── TOOLBAR ────────────────────────────────────────────────────── */}
      <Section title="Toolbar" subtitle="Sort, view toggle, results count above products">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Toolbar" checked={s.toolbar?.enabled} onChange={(v) => update('toolbar', 'enabled', v)} />
          <Toggle label="Show Result Count" checked={s.toolbar?.showResultCount} onChange={(v) => update('toolbar', 'showResultCount', v)} />
          <Toggle label="Show Sort Dropdown" checked={s.toolbar?.showSortDropdown} onChange={(v) => update('toolbar', 'showSortDropdown', v)} />
          <Toggle label="Show View Toggle" checked={s.toolbar?.showViewToggle} onChange={(v) => update('toolbar', 'showViewToggle', v)} />
          <Toggle label="Show Per-Page Selector" checked={s.toolbar?.showPerPageSelector} onChange={(v) => update('toolbar', 'showPerPageSelector', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Field label="Default Sort" type="select" value={s.toolbar?.defaultSort} onChange={(v) => update('toolbar', 'defaultSort', v)}
            options={['featured', 'newest', 'price-low', 'price-high', 'name-az', 'name-za', 'rating', 'best-selling']} />
          <Field label="Default View" type="select" value={s.toolbar?.defaultView} onChange={(v) => update('toolbar', 'defaultView', v)}
            options={['grid', 'list']} />
          <Field label="Default Per Page" type="number" value={s.toolbar?.defaultPerPage} onChange={(v) => update('toolbar', 'defaultPerPage', v)} min={4} max={100} />
        </div>
      </Section>

      {/* ─── PRODUCT GRID ───────────────────────────────────────────────── */}
      <Section title="Product Grid" subtitle="Grid columns, gaps, image aspect ratio">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Columns (Desktop)" type="number" value={s.productGrid?.columnsDesktop} onChange={(v) => update('productGrid', 'columnsDesktop', v)} min={2} max={6} />
          <Field label="Columns (Tablet)" type="number" value={s.productGrid?.columnsTablet} onChange={(v) => update('productGrid', 'columnsTablet', v)} min={1} max={4} />
          <Field label="Columns (Mobile)" type="number" value={s.productGrid?.columnsMobile} onChange={(v) => update('productGrid', 'columnsMobile', v)} min={1} max={3} />
          <Field label="Grid Gap (px)" type="number" value={s.productGrid?.gap} onChange={(v) => update('productGrid', 'gap', v)} min={0} max={48} />
          <Field label="Image Aspect Ratio" type="select" value={s.productGrid?.imageAspectRatio} onChange={(v) => update('productGrid', 'imageAspectRatio', v)}
            options={['square', '4:3', '3:4', '16:9', 'auto']} />
          <Field label="Image Fit" type="select" value={s.productGrid?.imageObjectFit} onChange={(v) => update('productGrid', 'imageObjectFit', v)}
            options={['cover', 'contain']} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Hover Effect" type="select" value={s.productGrid?.hoverEffect} onChange={(v) => update('productGrid', 'hoverEffect', v)}
            options={[{ value: 'zoom', label: 'Zoom' }, { value: 'swap-image', label: 'Swap Image' }, { value: 'overlay', label: 'Overlay' }, { value: 'none', label: 'None' }]} />
          <Field label="Hover Image Index" type="number" value={s.productGrid?.hoverImageIndex} onChange={(v) => update('productGrid', 'hoverImageIndex', v)} min={0} max={5} sublabel="Which image to show on hover (0=first)" />
        </div>
      </Section>

      {/* ─── PRODUCT CARD ───────────────────────────────────────────────── */}
      <Section title="Product Card" subtitle="What information to show on each product card">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Title & Text</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Title" checked={s.productCard?.showTitle} onChange={(v) => update('productCard', 'showTitle', v)} />
          <Toggle label="Show Category" checked={s.productCard?.showCategory} onChange={(v) => update('productCard', 'showCategory', v)} />
          <Toggle label="Show Brand" checked={s.productCard?.showBrand} onChange={(v) => update('productCard', 'showBrand', v)} />
          <Toggle label="Show SKU" checked={s.productCard?.showSKU} onChange={(v) => update('productCard', 'showSKU', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Field label="Title Lines (clamp)" type="number" value={s.productCard?.titleLines} onChange={(v) => update('productCard', 'titleLines', v)} min={1} max={4} />
          <Field label="Title Font Size (px)" type="number" value={s.productCard?.titleFontSize} onChange={(v) => update('productCard', 'titleFontSize', v)} />
          <Field label="Title Font Weight" type="select" value={s.productCard?.titleFontWeight} onChange={(v) => update('productCard', 'titleFontWeight', v)}
            options={['400', '500', '600', '700']} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Toggle label="Show Description (list view)" checked={s.productCard?.showDescription} onChange={(v) => update('productCard', 'showDescription', v)} />
          <Field label="Description Lines" type="number" value={s.productCard?.descriptionLines} onChange={(v) => update('productCard', 'descriptionLines', v)} min={1} max={5} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Price</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Price" checked={s.productCard?.showPrice} onChange={(v) => update('productCard', 'showPrice', v)} />
          <Toggle label="Show Original Price" checked={s.productCard?.showOriginalPrice} onChange={(v) => update('productCard', 'showOriginalPrice', v)} />
          <Toggle label="Show Discount Badge" checked={s.productCard?.showDiscountBadge} onChange={(v) => update('productCard', 'showDiscountBadge', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Price Font Size (px)" type="number" value={s.productCard?.priceFontSize} onChange={(v) => update('productCard', 'priceFontSize', v)} />
          <Field label="Sale Price Color" type="text" value={s.productCard?.salePriceColor} onChange={(v) => update('productCard', 'salePriceColor', v)} placeholder="#dc2626" />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Rating & Stock</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Rating" checked={s.productCard?.showRating} onChange={(v) => update('productCard', 'showRating', v)} />
          <Toggle label="Show Review Count" checked={s.productCard?.showReviewCount} onChange={(v) => update('productCard', 'showReviewCount', v)} />
          <Toggle label="Show Stock Status" checked={s.productCard?.showStock} onChange={(v) => update('productCard', 'showStock', v)} />
          <Toggle label="Show Stock Count" checked={s.productCard?.showStockCount} onChange={(v) => update('productCard', 'showStockCount', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Rating Size" type="select" value={s.productCard?.ratingSize} onChange={(v) => update('productCard', 'ratingSize', v)} options={['xs', 'sm', 'md']} />
          <Field label="Low Stock Threshold" type="number" value={s.productCard?.lowStockThreshold} onChange={(v) => update('productCard', 'lowStockThreshold', v)} min={1} max={50} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Badges</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Badges (from Badge Module)" checked={s.productCard?.showBadges} onChange={(v) => update('productCard', 'showBadges', v)} />
          <Field label="Badge Position" type="select" value={s.productCard?.badgePosition} onChange={(v) => update('productCard', 'badgePosition', v)}
            options={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />
          <Toggle label="Sale Badge" checked={s.productCard?.showSaleBadge} onChange={(v) => update('productCard', 'showSaleBadge', v)} />
          <Toggle label="New Badge" checked={s.productCard?.showNewBadge} onChange={(v) => update('productCard', 'showNewBadge', v)} />
          <Toggle label="Out of Stock Badge" checked={s.productCard?.showOutOfStockBadge} onChange={(v) => update('productCard', 'showOutOfStockBadge', v)} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Layby Indicator</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Layby Indicator" sublabel="Badge showing layby is available" checked={s.productCard?.showLaybyIndicator} onChange={(v) => update('productCard', 'showLaybyIndicator', v)} />
          <Field label="Indicator Text" type="text" value={s.productCard?.laybyIndicatorText} onChange={(v) => update('productCard', 'laybyIndicatorText', v)} />
          <Field label="Indicator Color" type="text" value={s.productCard?.laybyIndicatorColor} onChange={(v) => update('productCard', 'laybyIndicatorColor', v)} placeholder="#f59e0b" />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Delivery Estimate</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Delivery Estimate" checked={s.productCard?.showDeliveryEstimate} onChange={(v) => update('productCard', 'showDeliveryEstimate', v)} />
          <Field label="Estimate Text Template" type="text" value={s.productCard?.deliveryEstimateText} onChange={(v) => update('productCard', 'deliveryEstimateText', v)} sublabel="Use {days} as placeholder" />
          <Field label="Default Delivery Days" type="text" value={s.productCard?.defaultDeliveryDays} onChange={(v) => update('productCard', 'defaultDeliveryDays', v)} />
        </div>
        <h5 className="text-xs font-medium text-gray-600 mt-2 mb-1">Delivery Locations</h5>
        <ListEditor
          items={s.productCard?.deliveryLocations || []}
          onChange={(v) => update('productCard', 'deliveryLocations', v)}
          fields={[
            { key: 'label', label: 'Location', placeholder: 'Harare' },
            { key: 'estimateDays', label: 'Estimate', placeholder: '1-2 days' },
            { key: 'enabled', label: 'Active', type: 'toggle', default: true },
          ]}
          addLabel="Add delivery location"
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Quick Actions (Hover Buttons)</h4>
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Add to Cart" checked={s.productCard?.showAddToCart} onChange={(v) => update('productCard', 'showAddToCart', v)} />
          <Toggle label="Quick View" checked={s.productCard?.showQuickView} onChange={(v) => update('productCard', 'showQuickView', v)} />
          <Toggle label="Wishlist Button" checked={s.productCard?.showWishlistButton} onChange={(v) => update('productCard', 'showWishlistButton', v)} />
          <Toggle label="Compare Button" checked={s.productCard?.showCompareButton} onChange={(v) => update('productCard', 'showCompareButton', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Quick Actions Position" type="select" value={s.productCard?.quickActionsPosition} onChange={(v) => update('productCard', 'quickActionsPosition', v)}
            options={[{ value: 'overlay-right', label: 'Overlay Right' }, { value: 'overlay-top', label: 'Overlay Top' }, { value: 'below-image', label: 'Below Image' }, { value: 'on-hover-bottom', label: 'Hover Bottom Bar' }]} />
          <Field label="Add to Cart Style" type="select" value={s.productCard?.addToCartStyle} onChange={(v) => update('productCard', 'addToCartStyle', v)}
            options={[{ value: 'button', label: 'Button' }, { value: 'icon', label: 'Icon Only' }, { value: 'hover-bar', label: 'Hover Bar' }, { value: 'always-visible', label: 'Always Visible' }]} />
        </div>
      </Section>

      {/* ─── SIDEBAR / FILTERS ──────────────────────────────────────────── */}
      <Section title="Sidebar & Filters" subtitle="Filter widgets shown in the sidebar">
        <Toggle label="Enable Sidebar" checked={s.sidebar?.enabled} onChange={(v) => update('sidebar', 'enabled', v)} />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Sidebar Widgets</h4>
        <p className="text-xs text-gray-500 mb-2">Reorder, enable/disable filter widgets in the sidebar</p>
        <ListEditor
          items={s.sidebar?.widgets || []}
          onChange={(v) => update('sidebar', 'widgets', v)}
          fields={[
            { key: 'id', label: 'Widget ID', placeholder: 'categories' },
            { key: 'label', label: 'Label', placeholder: 'Categories' },
            { key: 'enabled', label: 'Enabled', type: 'toggle', default: true },
            { key: 'collapsed', label: 'Collapsed', type: 'toggle', default: false },
          ]}
          addLabel="Add widget"
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Category Filter Options</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display Type" type="select" value={s.sidebar?.categoryDisplayType} onChange={(v) => update('sidebar', 'categoryDisplayType', v)}
            options={['checkbox', 'list', 'accordion']} />
          <Field label="Price Range Type" type="select" value={s.sidebar?.priceRangeType} onChange={(v) => update('sidebar', 'priceRangeType', v)}
            options={['slider', 'inputs', 'both']} />
          <Toggle label="Show Category Count" checked={s.sidebar?.showCategoryCount} onChange={(v) => update('sidebar', 'showCategoryCount', v)} />
          <Toggle label="Show Category Icon" checked={s.sidebar?.showCategoryIcon} onChange={(v) => update('sidebar', 'showCategoryIcon', v)} />
          <Toggle label="Show Subcategories" checked={s.sidebar?.showSubcategories} onChange={(v) => update('sidebar', 'showSubcategories', v)} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">New Products Widget</h4>
        <Field label="Number of products" type="number" value={s.sidebar?.newProductsCount} onChange={(v) => update('sidebar', 'newProductsCount', v)} min={1} max={10} />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Sidebar Promo Banner</h4>
        <ImageUploadField label="Banner Image" value={s.sidebar?.sidebarBannerImage} onChange={(v) => update('sidebar', 'sidebarBannerImage', v)} />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Banner Link" type="text" value={s.sidebar?.sidebarBannerLink} onChange={(v) => update('sidebar', 'sidebarBannerLink', v)} />
          <Field label="Banner Text" type="text" value={s.sidebar?.sidebarBannerText} onChange={(v) => update('sidebar', 'sidebarBannerText', v)} />
        </div>
      </Section>

      {/* ─── PAGINATION ─────────────────────────────────────────────────── */}
      <Section title="Pagination" subtitle="How products are paginated">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pagination Type" type="select" value={s.pagination?.type} onChange={(v) => update('pagination', 'type', v)}
            options={[{ value: 'numbered', label: 'Numbered Pages' }, { value: 'load-more', label: 'Load More Button' }, { value: 'infinite-scroll', label: 'Infinite Scroll' }]} />
          <Field label="Max Page Buttons" type="number" value={s.pagination?.maxPageButtons} onChange={(v) => update('pagination', 'maxPageButtons', v)} min={3} max={10} />
          <Toggle label="Show Page Numbers" checked={s.pagination?.showPageNumbers} onChange={(v) => update('pagination', 'showPageNumbers', v)} />
          <Toggle label="Show Prev/Next" checked={s.pagination?.showPrevNext} onChange={(v) => update('pagination', 'showPrevNext', v)} />
          <Toggle label="Scroll to Top" checked={s.pagination?.scrollToTop} onChange={(v) => update('pagination', 'scrollToTop', v)} />
        </div>
        <Field label="Load More Button Text" type="text" value={s.pagination?.loadMoreText} onChange={(v) => update('pagination', 'loadMoreText', v)} />
      </Section>

      {/* ─── COMPARE ────────────────────────────────────────────────────── */}
      <Section title="Compare" subtitle="Product comparison feature">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Enable Compare" checked={s.compare?.enabled} onChange={(v) => update('compare', 'enabled', v)} />
          <Field label="Max Items" type="number" value={s.compare?.maxItems} onChange={(v) => update('compare', 'maxItems', v)} min={2} max={6} />
          <Toggle label="Show Floating Compare Bar" sublabel="Sticky bar at bottom when items are in compare list" checked={s.compare?.showFloatingBar} onChange={(v) => update('compare', 'showFloatingBar', v)} />
          <Field label="Floating Bar Position" type="select" value={s.compare?.floatingBarPosition} onChange={(v) => update('compare', 'floatingBarPosition', v)}
            options={['bottom', 'bottom-right']} />
        </div>
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Compare Table Fields</h4>
        <p className="text-xs text-gray-500 mb-2">Select which fields to show in the comparison table</p>
        <StringListEditor
          items={s.compare?.compareFields || []}
          onChange={(v) => update('compare', 'compareFields', v)}
          label="Add field"
          placeholder="e.g. specifications"
        />
      </Section>

      {/* ─── CATEGORY SHOWCASE ──────────────────────────────────────────── */}
      <Section title="Category Showcase" subtitle="Category display section (carousel, grid, etc.) — uses category icon images">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Enable Category Showcase" checked={s.categoryShowcase?.enabled} onChange={(v) => update('categoryShowcase', 'enabled', v)} />
          <Field label="Display Type" type="select" value={s.categoryShowcase?.displayType} onChange={(v) => update('categoryShowcase', 'displayType', v)}
            options={['carousel', 'grid', 'list', 'icon-grid']} />
          <Toggle label="Show Icon" checked={s.categoryShowcase?.showIcon} onChange={(v) => update('categoryShowcase', 'showIcon', v)} />
          <Toggle label="Show Name" checked={s.categoryShowcase?.showName} onChange={(v) => update('categoryShowcase', 'showName', v)} />
          <Toggle label="Show Product Count" checked={s.categoryShowcase?.showCount} onChange={(v) => update('categoryShowcase', 'showCount', v)} />
          <Toggle label="Show Description" checked={s.categoryShowcase?.showDescription} onChange={(v) => update('categoryShowcase', 'showDescription', v)} />
          <Toggle label="Show on Shop Page" checked={s.categoryShowcase?.showOnShopPage} onChange={(v) => update('categoryShowcase', 'showOnShopPage', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Field label="Columns (Desktop)" type="number" value={s.categoryShowcase?.columnsDesktop} onChange={(v) => update('categoryShowcase', 'columnsDesktop', v)} min={2} max={8} />
          <Field label="Columns (Tablet)" type="number" value={s.categoryShowcase?.columnsTablet} onChange={(v) => update('categoryShowcase', 'columnsTablet', v)} min={2} max={6} />
          <Field label="Columns (Mobile)" type="number" value={s.categoryShowcase?.columnsMobile} onChange={(v) => update('categoryShowcase', 'columnsMobile', v)} min={1} max={4} />
          <Field label="Icon Size (px)" type="number" value={s.categoryShowcase?.iconSize} onChange={(v) => update('categoryShowcase', 'iconSize', v)} min={24} max={128} />
          <Field label="Card Style" type="select" value={s.categoryShowcase?.cardStyle} onChange={(v) => update('categoryShowcase', 'cardStyle', v)}
            options={['minimal', 'bordered', 'elevated', 'filled']} />
          <Field label="Position" type="select" value={s.categoryShowcase?.position} onChange={(v) => update('categoryShowcase', 'position', v)}
            options={[{ value: 'above-products', label: 'Above Products' }, { value: 'below-banner', label: 'Below Banner' }, { value: 'in-sidebar', label: 'In Sidebar' }]} />
        </div>
      </Section>

      {/* ─── SEARCH RESULTS ─────────────────────────────────────────────── */}
      <Section title="Search Results" subtitle="Settings for search results page">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Search Term" checked={s.searchResults?.showSearchTerm} onChange={(v) => update('searchResults', 'showSearchTerm', v)} />
          <Toggle label="Show Suggestions" checked={s.searchResults?.showSuggestions} onChange={(v) => update('searchResults', 'showSuggestions', v)} />
          <Toggle label="Show Related Categories" checked={s.searchResults?.showRelatedCategories} onChange={(v) => update('searchResults', 'showRelatedCategories', v)} />
        </div>
        <Field label="No Results Message" type="textarea" value={s.searchResults?.noResultsMessage} onChange={(v) => update('searchResults', 'noResultsMessage', v)} />
      </Section>

      {/* ─── EMPTY STATE ────────────────────────────────────────────────── */}
      <Section title="Empty State" subtitle="What to show when no products match">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Icon / Emoji" type="text" value={s.emptyState?.icon} onChange={(v) => update('emptyState', 'icon', v)} />
          <Toggle label="Show Clear Filters Button" checked={s.emptyState?.showClearFiltersButton} onChange={(v) => update('emptyState', 'showClearFiltersButton', v)} />
        </div>
        <Field label="Title" type="text" value={s.emptyState?.title} onChange={(v) => update('emptyState', 'title', v)} />
        <Field label="Message" type="text" value={s.emptyState?.message} onChange={(v) => update('emptyState', 'message', v)} />
      </Section>

      {/* ─── MOBILE ─────────────────────────────────────────────────────── */}
      <Section title="Mobile" subtitle="Mobile-specific layout options">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Filter Drawer Position" type="select" value={s.mobile?.filterDrawerPosition} onChange={(v) => update('mobile', 'filterDrawerPosition', v)}
            options={['left', 'right', 'bottom']} />
          <Toggle label="Sticky Filter Bar" checked={s.mobile?.showStickyFilterBar} onChange={(v) => update('mobile', 'showStickyFilterBar', v)} />
          <Toggle label="Back to Top Button" checked={s.mobile?.showBackToTop} onChange={(v) => update('mobile', 'showBackToTop', v)} />
        </div>
      </Section>

      {/* ─── THEME ──────────────────────────────────────────────────────── */}
      <Section title="Theme" subtitle="Colors, borders, shadows for archive pages">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Primary Color" type="text" value={s.theme?.primaryColor} onChange={(v) => update('theme', 'primaryColor', v)} placeholder="#1b5e35" />
          <Field label="Accent Color" type="text" value={s.theme?.accentColor} onChange={(v) => update('theme', 'accentColor', v)} placeholder="#f59e0b" />
          <Field label="Card Background" type="text" value={s.theme?.cardBackground} onChange={(v) => update('theme', 'cardBackground', v)} />
          <Field label="Card Border Color" type="text" value={s.theme?.cardBorderColor} onChange={(v) => update('theme', 'cardBorderColor', v)} />
          <Field label="Card Border Radius (px)" type="number" value={s.theme?.cardBorderRadius} onChange={(v) => update('theme', 'cardBorderRadius', v)} min={0} max={24} />
          <Field label="Card Shadow" type="select" value={s.theme?.cardShadow} onChange={(v) => update('theme', 'cardShadow', v)} options={['none', 'sm', 'md', 'lg']} />
          <Field label="Hover Shadow" type="select" value={s.theme?.hoverShadow} onChange={(v) => update('theme', 'hoverShadow', v)} options={['none', 'sm', 'md', 'lg', 'xl']} />
          <Field label="Sidebar Background" type="text" value={s.theme?.sidebarBackground} onChange={(v) => update('theme', 'sidebarBackground', v)} />
          <Field label="Toolbar Background" type="text" value={s.theme?.toolbarBackground} onChange={(v) => update('theme', 'toolbarBackground', v)} />
        </div>
      </Section>
    </div>
  );
}
