import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productPageSettingsAPI, imagesAPI, productsAIAPI, productsAPI, categoriesAPI } from '../services/api';
import toast from '@/utils/toast';
import {
  IoChevronDown,
  IoChevronUp,
  IoSaveOutline,
  IoRefreshOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoReorderThreeOutline,
} from 'react-icons/io5';

// ── Helper: Toggle Switch ────────────────────────────────────────────────────
function Toggle({ label, sublabel, checked, onChange, disabled }) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer group ${disabled ? 'opacity-50' : ''}`}>
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
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

// ── Helper: Input Field ──────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, min, max, options, rows }) {
  if (type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600">
          {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 resize-none" />
      </div>
    );
  }
  if (type === 'color') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-28 px-2 py-1.5 border border-gray-300 text-sm font-mono" />
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder} min={min} max={max} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600" />
    </div>
  );
}

// ── Helper: Section Wrapper ──────────────────────────────────────────────────
function Section({ title, description, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-gray-200 bg-white mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {open ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
      </button>
      {open && <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">{children}</div>}
    </div>
  );
}

// ── List Editor (generic for trust badges, delivery options, etc.) ───────────
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

// ── String List Editor (for simple string arrays) ────────────────────────────
function StringListEditor({ items = [], onChange, label = 'Add item', placeholder = '' }) {
  return (
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[idx] = e.target.value;
              onChange(updated);
            }}
            className="flex-1 px-2 py-1 border border-gray-300 text-xs"
            placeholder={placeholder}
          />
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><IoTrashOutline size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50">
        <IoAddCircleOutline size={14} /> {label}
      </button>
    </div>
  );
}

// ── Payment Method Editor (supports icon, text-only, or uploaded image) ───────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PaymentMethodEditor({ items = [], onChange }) {
  const handleAdd = () => {
    onChange([...items, { id: '', label: '', displayType: 'icon', icon: '', image: '', enabled: true, order: items.length }]);
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
  const handleImageUpload = async (idx, file) => {
    try {
      const res = await imagesAPI.upload(file);
      const url = res.data?.url || res.data?.data?.url || '';
      handleChange(idx, 'image', url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-3 bg-gray-50 border border-gray-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveItem(idx, -1)} className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
              <button onClick={() => moveItem(idx, 1)} className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
            </div>
            <Toggle label="" checked={item.enabled ?? true} onChange={(v) => handleChange(idx, 'enabled', v)} />
            <input type="text" value={item.id || ''} onChange={(e) => handleChange(idx, 'id', e.target.value)} className="w-20 px-2 py-1 border border-gray-300 text-xs" placeholder="id" />
            <input type="text" value={item.label || ''} onChange={(e) => handleChange(idx, 'label', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 text-xs" placeholder="Label" />
            <button onClick={() => handleRemove(idx)} className="p-1 text-red-400 hover:text-red-600"><IoTrashOutline size={16} /></button>
          </div>
          <div className="flex items-center gap-3 ml-8">
            <label className="text-xs text-gray-500">Display:</label>
            <select value={item.displayType || 'icon'} onChange={(e) => handleChange(idx, 'displayType', e.target.value)} className="px-2 py-1 border border-gray-300 text-xs w-24">
              <option value="icon">Emoji/Icon</option>
              <option value="text">Text Only</option>
              <option value="image">Image/Logo</option>
            </select>
            {(item.displayType === 'icon' || !item.displayType) && (
              <input type="text" value={item.icon || ''} onChange={(e) => handleChange(idx, 'icon', e.target.value)} className="w-20 px-2 py-1 border border-gray-300 text-xs" placeholder="🏦" />
            )}
            {item.displayType === 'image' && (
              <div className="flex items-center gap-2">
                {item.image && (
                  <img src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} alt="" className="w-8 h-8 object-contain border border-gray-200 rounded" />
                )}
                <label className="px-2 py-1 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 cursor-pointer transition-colors">
                  {item.image ? 'Change' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(idx, e.target.files[0]); }} />
                </label>
                {item.image && <button onClick={() => handleChange(idx, 'image', '')} className="text-xs text-red-500 hover:text-red-700">Remove</button>}
              </div>
            )}
            {/* Preview */}
            <div className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs">
              {item.displayType === 'image' && item.image ? (
                <img src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} alt="" className="h-4 object-contain" />
              ) : item.displayType === 'text' ? null : (
                <span>{item.icon || '?'}</span>
              )}
              <span className="font-medium">{item.label || 'Method'}</span>
            </div>
          </div>
        </div>
      ))}
      <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 hover:bg-green-50 transition-colors">
        <IoAddCircleOutline size={14} /> Add payment method
      </button>
    </div>
  );
}

// ── Bulk AI Spec Generator ───────────────────────────────────────────────────
function BulkSpecGenerator() {
  const [mode, setMode] = useState('all'); // 'all' | 'category' | 'missing'
  const [categoryId, setCategoryId] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState(null);

  const { data: categoriesData } = useQuery('categories-for-specs', () => categoriesAPI.getAll(), { staleTime: 60000 });
  const categories = categoriesData?.data?.data || categoriesData?.data || [];

  const bulkMutation = useMutation(
    (data) => productsAIAPI.bulkGenerateSpecs(data),
    {
      onSuccess: (res) => {
        const d = res.data;
        setResult(d);
        toast.success(`Generated specs for ${d.success || 0} products`);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Bulk generation failed');
      },
    }
  );

  const handleGenerate = () => {
    const payload = { overwrite };
    if (mode === 'category' && categoryId) payload.categoryId = categoryId;
    if (mode === 'missing') payload.onlyMissing = true;
    bulkMutation.mutate(payload);
  };

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h4 className="text-sm font-bold text-purple-900">AI Bulk Specification Generator</h4>
      </div>
      <p className="text-xs text-purple-700">Uses your configured AI provider to auto-generate product specifications in bulk.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Generate For</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500">
            <option value="all">All Products</option>
            <option value="category">Specific Category</option>
            <option value="missing">Only Products Missing Specs</option>
          </select>
        </div>

        {mode === 'category' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-purple-500">
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
        <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="rounded border-gray-300" />
        Overwrite existing specifications
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={bulkMutation.isLoading || (mode === 'category' && !categoryId)}
          className="px-5 py-2 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {bulkMutation.isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Generating...
            </>
          ) : (
            <>✨ Generate Specifications</>
          )}
        </button>
        {bulkMutation.isLoading && (
          <span className="text-xs text-purple-600">This may take a few minutes for large catalogs...</span>
        )}
      </div>

      {result && (
        <div className="p-3 bg-white border border-purple-200 text-sm space-y-1">
          <p className="font-medium text-purple-900">Generation Complete</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-gray-500">Total:</span> <span className="font-bold">{result.total || 0}</span></div>
            <div><span className="text-gray-500">Success:</span> <span className="font-bold text-green-600">{result.success || 0}</span></div>
            <div><span className="text-gray-500">Failed:</span> <span className="font-bold text-red-500">{result.failed || 0}</span></div>
            {result.skipped > 0 && <div><span className="text-gray-500">Skipped:</span> <span className="font-bold text-gray-500">{result.skipped}</span></div>}
          </div>
          {result.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">Show errors ({result.errors.length})</summary>
              <ul className="mt-1 text-xs text-red-500 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((err, i) => <li key={i}>• {err.productName || err.productId}: {err.error}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProductPageSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { isLoading, error } = useQuery('productPageSettings', () => productPageSettingsAPI.get(), {
    retry: 1,
    onSuccess: (res) => {
      setSettings(res.data?.data || res.data || {});
    },
    onError: (err) => {
      console.error('Failed to load product page settings:', err);
      toast.error(err.response?.data?.message || 'Failed to load product page settings');
    },
  });

  const saveMutation = useMutation((data) => productPageSettingsAPI.update(data), {
    onSuccess: () => {
      toast.success('Settings saved!');
      setDirty(false);
      queryClient.invalidateQueries('productPageSettings');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const resetMutation = useMutation(() => productPageSettingsAPI.reset(), {
    onSuccess: (res) => {
      setSettings(res.data?.data || {});
      toast.success('Settings reset to defaults');
      setDirty(false);
      queryClient.invalidateQueries('productPageSettings');
    },
  });

  // Helper to update nested settings
  const update = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setDirty(true);
  };

  // Helper for deeply nested (e.g., conversionEnhancers.urgency.enabled)
  const updateDeep = (section, subSection, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: { ...prev[section]?.[subSection], [key]: value },
      },
    }));
    setDirty(true);
  };

  const updateRoot = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  if (error || !settings) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-medium mb-2">Failed to load product page settings</p>
        <p className="text-sm text-gray-500 mb-4">{error?.response?.data?.message || error?.message || 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const s = settings;

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Page Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure every element of the customer-facing product detail page</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (confirm('Reset ALL settings to defaults?')) resetMutation.mutate(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
          >
            <IoRefreshOutline size={16} /> Reset
          </button>
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={!dirty || saveMutation.isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-green-700 text-white font-bold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <IoSaveOutline size={16} /> {saveMutation.isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border-2 border-amber-300 text-amber-800 text-sm font-medium">
          ⚠ You have unsaved changes
        </div>
      )}

      {/* ═══ LAYOUT ═══ */}
      <Section title="Layout" description="Page structure and column configuration" defaultOpen={true}>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Layout Type" type="select" value={s.layout?.type} onChange={(v) => update('layout', 'type', v)} options={[{value: '3-col-walmart', label: '3-Column Walmart Style'}, {value: '2-col', label: '2-Column Standard'}]} />
          <Field label="Max Width (px)" type="number" value={s.layout?.maxWidth} onChange={(v) => update('layout', 'maxWidth', v)} min={960} max={1920} />
          <Field label="Gap (px)" type="number" value={s.layout?.gap} onChange={(v) => update('layout', 'gap', v)} min={0} max={64} />
          <Field label="Gallery Column Width" type="text" value={s.layout?.galleryColumnWidth} onChange={(v) => update('layout', 'galleryColumnWidth', v)} placeholder="420px" />
          <Field label="Fulfillment Column Width" type="text" value={s.layout?.fulfillmentColumnWidth} onChange={(v) => update('layout', 'fulfillmentColumnWidth', v)} placeholder="300px" />
          <Field label="Sticky Offset (px)" type="number" value={s.layout?.stickyOffset} onChange={(v) => update('layout', 'stickyOffset', v)} min={0} max={300} />
        </div>
        <div className="flex gap-6 mt-3">
          <Toggle label="Sticky Gallery" checked={s.layout?.stickyGallery} onChange={(v) => update('layout', 'stickyGallery', v)} />
          <Toggle label="Sticky Fulfillment Box" checked={s.layout?.stickyFulfillment} onChange={(v) => update('layout', 'stickyFulfillment', v)} />
        </div>
      </Section>

      {/* ═══ BREADCRUMBS ═══ */}
      <Section title="Breadcrumbs" description="Navigation trail above product">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Show Breadcrumbs" checked={s.breadcrumbs?.enabled} onChange={(v) => update('breadcrumbs', 'enabled', v)} />
          <Toggle label="Show Home" checked={s.breadcrumbs?.showHome} onChange={(v) => update('breadcrumbs', 'showHome', v)} />
          <Toggle label="Show Category" checked={s.breadcrumbs?.showCategory} onChange={(v) => update('breadcrumbs', 'showCategory', v)} />
          <Toggle label="Show Sub-Category" checked={s.breadcrumbs?.showSubCategory} onChange={(v) => update('breadcrumbs', 'showSubCategory', v)} />
        </div>
      </Section>

      {/* ═══ GALLERY ═══ */}
      <Section title="Product Gallery" description="Image gallery configuration">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Gallery" checked={s.gallery?.enabled} onChange={(v) => update('gallery', 'enabled', v)} />
          <Toggle label="Show Thumbnails" checked={s.gallery?.showThumbnails} onChange={(v) => update('gallery', 'showThumbnails', v)} />
          <Toggle label="Show Zoom on Hover" checked={s.gallery?.showZoom} onChange={(v) => update('gallery', 'showZoom', v)} />
          <Toggle label="Show Badge Overlay" sublabel="e.g. 'Save $50'" checked={s.gallery?.showBadgeOverlay} onChange={(v) => update('gallery', 'showBadgeOverlay', v)} />
          <Toggle label="Show Wishlist Button" checked={s.gallery?.showWishlistButton} onChange={(v) => update('gallery', 'showWishlistButton', v)} />
          <Toggle label="Show Share Button" checked={s.gallery?.showShareButton} onChange={(v) => update('gallery', 'showShareButton', v)} />
          <Toggle label="Show Image Counter" checked={s.gallery?.showImageCounter} onChange={(v) => update('gallery', 'showImageCounter', v)} />
          <Toggle label="Enable Lightbox" checked={s.gallery?.enableLightbox} onChange={(v) => update('gallery', 'enableLightbox', v)} />
          <Toggle label="Swipe on Mobile" checked={s.gallery?.enableSwipeOnMobile} onChange={(v) => update('gallery', 'enableSwipeOnMobile', v)} />
          <Toggle label="Show Video Thumbnail" checked={s.gallery?.showVideoThumbnail} onChange={(v) => update('gallery', 'showVideoThumbnail', v)} />
        </div>
        <Field label="Badge Overlay Type" type="select" value={s.gallery?.badgeOverlayType} onChange={(v) => update('gallery', 'badgeOverlayType', v)} options={['save-amount', 'percentage', 'custom-text', 'badge-module']} />

        {/* Arrow Navigation */}
        <div className="mt-4 p-4 border border-gray-200 bg-gray-50">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Navigation Arrows</h4>
          <Toggle label="Show Navigation Arrows" checked={s.gallery?.showNavigationArrows !== false} onChange={(v) => update('gallery', 'showNavigationArrows', v)} />
          <div className="grid grid-cols-3 gap-3 mt-3">
            <Field label="Arrow Icon" type="select" value={s.gallery?.arrows?.icon || 'chevron'} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), icon: v }; update('gallery', 'arrows', a); }} options={['chevron', 'arrow-thin', 'triangle']} />
            <Field label="Icon Color" type="color" value={s.gallery?.arrows?.iconColor || '#ffffff'} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), iconColor: v }; update('gallery', 'arrows', a); }} />
            <Field label="Background Color (hex or rgba)" type="text" value={s.gallery?.arrows?.bgColor || 'rgba(27,94,53,0.85)'} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), bgColor: v }; update('gallery', 'arrows', a); }} />
            <Field label="Icon Size (px)" type="number" value={s.gallery?.arrows?.size ?? 36} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), size: Number(v) }; update('gallery', 'arrows', a); }} min={20} max={80} />
            <Field label="Padding (px)" type="number" value={s.gallery?.arrows?.padding ?? 8} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), padding: Number(v) }; update('gallery', 'arrows', a); }} min={0} max={30} />
            <Field label="Border Radius (px)" type="number" value={s.gallery?.arrows?.borderRadius ?? 4} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), borderRadius: Number(v) }; update('gallery', 'arrows', a); }} min={0} max={50} />
            <Field label="Margin from Edge (px)" type="number" value={s.gallery?.arrows?.margin ?? 8} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), margin: Number(v) }; update('gallery', 'arrows', a); }} min={0} max={40} />
            <Field label="Border (CSS)" type="text" value={s.gallery?.arrows?.border || 'none'} onChange={(v) => { const a = { ...(s.gallery?.arrows || {}), border: v }; update('gallery', 'arrows', a); }} />
          </div>
        </div>
      </Section>

      {/* ═══ PRODUCT INFO ═══ */}
      <Section title="Product Information" description="Middle column — product details">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Brand" checked={s.productInfo?.showBrand} onChange={(v) => update('productInfo', 'showBrand', v)} />
          <Toggle label="Show Name" checked={s.productInfo?.showName} onChange={(v) => update('productInfo', 'showName', v)} />
          <Toggle label="Show Rating" checked={s.productInfo?.showRating} onChange={(v) => update('productInfo', 'showRating', v)} />
          <Toggle label="Show Review Count" checked={s.productInfo?.showReviewCount} onChange={(v) => update('productInfo', 'showReviewCount', v)} />
          <Toggle label="Show Qty Sold" checked={s.productInfo?.showQtySold} onChange={(v) => update('productInfo', 'showQtySold', v)} />
          <Toggle label="Show SKU" checked={s.productInfo?.showSKU} onChange={(v) => update('productInfo', 'showSKU', v)} />
          <Toggle label="Show Price" checked={s.productInfo?.showPrice} onChange={(v) => update('productInfo', 'showPrice', v)} />
          <Toggle label="Show Original Price" checked={s.productInfo?.showOriginalPrice} onChange={(v) => update('productInfo', 'showOriginalPrice', v)} />
          <Toggle label="Show Save Badge" checked={s.productInfo?.showSaveBadge} onChange={(v) => update('productInfo', 'showSaveBadge', v)} />
          <Toggle label="Show PESA Coins" checked={s.productInfo?.showPesaCoins} onChange={(v) => update('productInfo', 'showPesaCoins', v)} />
          <Toggle label="Show Estimated Delivery" checked={s.productInfo?.showEstimatedDelivery} onChange={(v) => update('productInfo', 'showEstimatedDelivery', v)} />
          <Toggle label="Show Free Shipping Zones" checked={s.productInfo?.showFreeShippingZones} onChange={(v) => update('productInfo', 'showFreeShippingZones', v)} />
          <Toggle label="Show Stock Status" checked={s.productInfo?.showStockStatus} onChange={(v) => update('productInfo', 'showStockStatus', v)} />
          <Toggle label="Show Stock Pulse" sublabel="Animated pulse dot for stock" checked={s.productInfo?.showStockPulse} onChange={(v) => update('productInfo', 'showStockPulse', v)} />
          <Toggle label="Show Short Description" checked={s.productInfo?.showShortDescription} onChange={(v) => update('productInfo', 'showShortDescription', v)} />
          <Toggle label="Show Categories" checked={s.productInfo?.showCategories} onChange={(v) => update('productInfo', 'showCategories', v)} />
          <Toggle label="Show Tags" checked={s.productInfo?.showTags} onChange={(v) => update('productInfo', 'showTags', v)} />
          <Toggle label="Show Variants" checked={s.productInfo?.showVariants} onChange={(v) => update('productInfo', 'showVariants', v)} />
          <Toggle label="Show Quick Specs" checked={s.productInfo?.showQuickSpecs} onChange={(v) => update('productInfo', 'showQuickSpecs', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Field label="Save Badge Type" type="select" value={s.productInfo?.saveBadgeType} onChange={(v) => update('productInfo', 'saveBadgeType', v)} options={['amount', 'percentage', 'both']} />
          <Field label="PESA Coins Label" type="text" value={s.productInfo?.pesaCoinsLabel} onChange={(v) => update('productInfo', 'pesaCoinsLabel', v)} />
          <Field label="Estimated Delivery Days" type="number" value={s.productInfo?.estimatedDeliveryDays} onChange={(v) => update('productInfo', 'estimatedDeliveryDays', v)} min={1} max={30} />
          <Field label="Low Stock Threshold" type="number" value={s.productInfo?.lowStockThreshold} onChange={(v) => update('productInfo', 'lowStockThreshold', v)} min={1} max={50} />
          <Field label="Quick Specs Count" type="number" value={s.productInfo?.quickSpecsCount} onChange={(v) => update('productInfo', 'quickSpecsCount', v)} min={1} max={10} />
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Free Shipping Zones</h4>
          <ListEditor
            items={s.productInfo?.freeShippingZones || []}
            onChange={(v) => update('productInfo', 'freeShippingZones', v)}
            fields={[
              { key: 'code', label: 'Code', placeholder: 'HRE' },
              { key: 'label', label: 'Label', placeholder: 'Harare' },
              { key: 'enabled', label: 'Enabled', type: 'toggle', default: true },
            ]}
            addLabel="Add zone"
          />
        </div>
      </Section>

      {/* ═══ SPECIFICATIONS ═══ */}
      <Section title="Specifications" description="Product specs section + AI auto-generation">
        <Toggle label="Enable Specifications" checked={s.specifications?.enabled} onChange={(v) => update('specifications', 'enabled', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display Style" type="select" value={s.specifications?.displayStyle} onChange={(v) => update('specifications', 'displayStyle', v)} options={['grid', 'table', 'list']} />
          <Toggle label="Show Quick Specs in Info" checked={s.specifications?.showQuickSpecsInInfo} onChange={(v) => update('specifications', 'showQuickSpecsInInfo', v)} />
          <Toggle label="AI Auto-Generate" sublabel="Auto-generate specs for new products" checked={s.specifications?.aiAutoGenerate} onChange={(v) => update('specifications', 'aiAutoGenerate', v)} />
        </div>
        <Field label="AI Prompt Template" type="textarea" value={s.specifications?.aiPromptTemplate} onChange={(v) => update('specifications', 'aiPromptTemplate', v)} rows={3} />

        {/* AI Bulk Spec Generation */}
        <BulkSpecGenerator />
      </Section>

      {/* ═══ SECTIONS ═══ */}
      <Section title="Collapsible Sections" description="Sections below product info — drag to reorder">
        <div className="space-y-2">
          {(s.sections || []).sort((a, b) => a.order - b.order).map((sec, idx) => (
            <div key={sec.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <IoReorderThreeOutline size={18} className="text-gray-400" />
              <div className="flex items-center gap-1">
                <button onClick={() => {
                  if (idx === 0) return;
                  const sorted = [...(s.sections || [])].sort((a, b) => a.order - b.order);
                  [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
                  sorted.forEach((item, i) => { item.order = i; });
                  updateRoot('sections', sorted);
                }} className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
                <button onClick={() => {
                  const sorted = [...(s.sections || [])].sort((a, b) => a.order - b.order);
                  if (idx >= sorted.length - 1) return;
                  [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
                  sorted.forEach((item, i) => { item.order = i; });
                  updateRoot('sections', sorted);
                }} className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
              </div>
              <Toggle label="" checked={sec.enabled} onChange={(v) => {
                const updated = [...(s.sections || [])];
                const target = updated.find(s => s.id === sec.id);
                if (target) target.enabled = v;
                updateRoot('sections', updated);
              }} />
              <input
                type="text"
                value={sec.label}
                onChange={(e) => {
                  const updated = [...(s.sections || [])];
                  const target = updated.find(s => s.id === sec.id);
                  if (target) target.label = e.target.value;
                  updateRoot('sections', updated);
                }}
                className="flex-1 px-2 py-1 border border-gray-300 text-sm"
              />
              <span className="text-xs text-gray-400 font-mono">{sec.id}</span>
              <Toggle label="Collapsed" checked={sec.collapsed} onChange={(v) => {
                const updated = [...(s.sections || [])];
                const target = updated.find(s => s.id === sec.id);
                if (target) target.collapsed = v;
                updateRoot('sections', updated);
              }} />
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ FULFILLMENT BOX ═══ */}
      <Section title="Fulfillment Box" description="Right column — pricing, delivery, buy buttons">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Enable Fulfillment Box" checked={s.fulfillmentBox?.enabled} onChange={(v) => update('fulfillmentBox', 'enabled', v)} />
          <Toggle label="Show Price" checked={s.fulfillmentBox?.showPrice} onChange={(v) => update('fulfillmentBox', 'showPrice', v)} />
          <Toggle label="Show PESA Coins" checked={s.fulfillmentBox?.showPesaCoins} onChange={(v) => update('fulfillmentBox', 'showPesaCoins', v)} />
          <Toggle label="Show Laybye" checked={s.fulfillmentBox?.showLaybye} onChange={(v) => update('fulfillmentBox', 'showLaybye', v)} />
          <Toggle label="Show Delivery Options" checked={s.fulfillmentBox?.showDeliveryOptions} onChange={(v) => update('fulfillmentBox', 'showDeliveryOptions', v)} />
          <Toggle label="Show Qty Control" checked={s.fulfillmentBox?.showQtyControl} onChange={(v) => update('fulfillmentBox', 'showQtyControl', v)} />
          <Toggle label="Show Buy Now" checked={s.fulfillmentBox?.showBuyNow} onChange={(v) => update('fulfillmentBox', 'showBuyNow', v)} />
          <Toggle label="Show Add to Cart" checked={s.fulfillmentBox?.showAddToCart} onChange={(v) => update('fulfillmentBox', 'showAddToCart', v)} />
          <Toggle label="Show Trust Badges" checked={s.fulfillmentBox?.showTrustBadges} onChange={(v) => update('fulfillmentBox', 'showTrustBadges', v)} />
          <Toggle label="Show Payment Method Logos" checked={s.fulfillmentBox?.showPaymentMethodLogos} onChange={(v) => update('fulfillmentBox', 'showPaymentMethodLogos', v)} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Delivery Options</h4>
        <ListEditor
          items={s.fulfillmentBox?.deliveryOptions || []}
          onChange={(v) => update('fulfillmentBox', 'deliveryOptions', v)}
          fields={[
            { key: 'id', label: 'ID', placeholder: 'delivery' },
            { key: 'label', label: 'Label', placeholder: 'Delivery' },
            { key: 'icon', label: 'Icon', placeholder: '🚚' },
            { key: 'subtitle', label: 'Subtitle', placeholder: 'Available · Main Store' },
            { key: 'price', label: 'Price', type: 'number', default: 0 },
            { key: 'isFree', label: 'Free?', type: 'toggle', default: true },
          ]}
          addLabel="Add delivery option"
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Trust Badges</h4>
        <ListEditor
          items={s.fulfillmentBox?.trustBadges || []}
          onChange={(v) => update('fulfillmentBox', 'trustBadges', v)}
          fields={[
            { key: 'icon', label: 'Icon', placeholder: '🔒' },
            { key: 'text', label: 'Text', placeholder: 'Secure checkout' },
            { key: 'enabled', label: 'Enabled', type: 'toggle', default: true },
          ]}
          addLabel="Add trust badge"
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Payment Methods</h4>
        <StringListEditor items={s.fulfillmentBox?.paymentMethods || []} onChange={(v) => update('fulfillmentBox', 'paymentMethods', v)} label="Add method" placeholder="VISA" />
      </Section>

      {/* ═══ LAYBYE DISPLAY ═══ */}
      <Section title="Laybye Display" description="How laybye payment plans appear on the product page">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Display Mode" type="select" value={s.laybyeDisplay?.displayMode} onChange={(v) => update('laybyeDisplay', 'displayMode', v)} options={[{value: 'inline-plans', label: 'Inline Plans'}, {value: 'widget-modal', label: 'Widget Modal (Existing)'}, {value: 'both', label: 'Both'}]} />
          <Toggle label="Show in Fulfillment Box" checked={s.laybyeDisplay?.showInFulfillmentBox} onChange={(v) => update('laybyeDisplay', 'showInFulfillmentBox', v)} />
          <Toggle label="Show in Product Info" checked={s.laybyeDisplay?.showInProductInfo} onChange={(v) => update('laybyeDisplay', 'showInProductInfo', v)} />
          <Toggle label="Show Deposit Calculation" checked={s.laybyeDisplay?.showDepositCalculation} onChange={(v) => update('laybyeDisplay', 'showDepositCalculation', v)} />
          <Toggle label="Show Monthly Breakdown" checked={s.laybyeDisplay?.showMonthlyBreakdown} onChange={(v) => update('laybyeDisplay', 'showMonthlyBreakdown', v)} />
          <Toggle label="Show Total Payable" checked={s.laybyeDisplay?.showTotalPayable} onChange={(v) => update('laybyeDisplay', 'showTotalPayable', v)} />
          <Toggle label="Show Info Bullets" checked={s.laybyeDisplay?.showInfoBullets} onChange={(v) => update('laybyeDisplay', 'showInfoBullets', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Field label="Toggle Label" type="text" value={s.laybyeDisplay?.toggleLabel} onChange={(v) => update('laybyeDisplay', 'toggleLabel', v)} />
          <Field label="Toggle Sub-Label" type="text" value={s.laybyeDisplay?.toggleSubLabel} onChange={(v) => update('laybyeDisplay', 'toggleSubLabel', v)} />
          <Field label="Toggle Icon" type="text" value={s.laybyeDisplay?.toggleIcon} onChange={(v) => update('laybyeDisplay', 'toggleIcon', v)} />
        </div>
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Info Bullets</h4>
        <StringListEditor items={s.laybyeDisplay?.infoBullets || []} onChange={(v) => update('laybyeDisplay', 'infoBullets', v)} label="Add bullet" placeholder="✓ No credit check" />
      </Section>

      {/* ═══ BUTTONS ═══ */}
      <Section title="Buttons" description="Buy Now / Add to Cart button styling and behaviour">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Button Style" type="select" value={s.buttons?.style} onChange={(v) => update('buttons', 'style', v)} options={['neon-glow', 'standard', 'gradient', 'outline']} />
          <Field label="Buy Now Action" type="select" value={s.buttons?.buyNowAction} onChange={(v) => update('buttons', 'buyNowAction', v)} options={[{value: 'checkout-drawer', label: 'Checkout Drawer (Slide In)'}, {value: 'checkout-page', label: 'Checkout Page (Full Page)'}, {value: 'cart-page', label: 'Cart Page'}]} />
          <Toggle label="Shimmer Effect" checked={s.buttons?.showShimmerEffect} onChange={(v) => update('buttons', 'showShimmerEffect', v)} />
          <Toggle label="Pulse Effect" checked={s.buttons?.showPulseEffect} onChange={(v) => update('buttons', 'showPulseEffect', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Field label="Buy Now Label" type="text" value={s.buttons?.buyNowLabel} onChange={(v) => update('buttons', 'buyNowLabel', v)} />
          <Field label="Add to Cart Label" type="text" value={s.buttons?.addToCartLabel} onChange={(v) => update('buttons', 'addToCartLabel', v)} />
          <Field label="Added to Cart Label" type="text" value={s.buttons?.addedToCartLabel} onChange={(v) => update('buttons', 'addedToCartLabel', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Field label="Laybye Buy Label" type="text" value={s.buttons?.laybyeBuyLabel} onChange={(v) => update('buttons', 'laybyeBuyLabel', v)} />
          <Field label="Laybye Cart Label" type="text" value={s.buttons?.laybyeCartLabel} onChange={(v) => update('buttons', 'laybyeCartLabel', v)} />
        </div>
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Button Colors</h4>
        <div className="grid grid-cols-5 gap-4">
          <Field label="Primary BG" type="color" value={s.buttons?.primaryBg} onChange={(v) => update('buttons', 'primaryBg', v)} />
          <Field label="Primary Text" type="color" value={s.buttons?.primaryTextColor} onChange={(v) => update('buttons', 'primaryTextColor', v)} />
          <Field label="Primary Glow" type="text" value={s.buttons?.primaryGlowColor} onChange={(v) => update('buttons', 'primaryGlowColor', v)} />
          <Field label="Secondary BG" type="color" value={s.buttons?.secondaryBg} onChange={(v) => update('buttons', 'secondaryBg', v)} />
          <Field label="Secondary Text" type="color" value={s.buttons?.secondaryTextColor} onChange={(v) => update('buttons', 'secondaryTextColor', v)} />
        </div>
      </Section>

      {/* ═══ CHECKOUT DRAWER ═══ */}
      <Section title="Checkout Drawer" description="Sliding checkout panel — full checkout flow">
        <div className="grid grid-cols-3 gap-4">
          <Toggle label="Enable Checkout Drawer" checked={s.checkoutDrawer?.enabled} onChange={(v) => update('checkoutDrawer', 'enabled', v)} />
          <Field label="Position" type="select" value={s.checkoutDrawer?.position} onChange={(v) => update('checkoutDrawer', 'position', v)} options={['right', 'left']} />
          <Field label="Width" type="text" value={s.checkoutDrawer?.width} onChange={(v) => update('checkoutDrawer', 'width', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Toggle label="Show Overlay" checked={s.checkoutDrawer?.showOverlay} onChange={(v) => update('checkoutDrawer', 'showOverlay', v)} />
          <Toggle label="Show Delivery/Pickup Choice" checked={s.checkoutDrawer?.showDeliveryPickupChoice} onChange={(v) => update('checkoutDrawer', 'showDeliveryPickupChoice', v)} />
          <Toggle label="Require Address Always" sublabel="Customer must enter address even for pickup" checked={s.checkoutDrawer?.requireAddressAlways} onChange={(v) => update('checkoutDrawer', 'requireAddressAlways', v)} />
          <Toggle label="Show Payment Methods" checked={s.checkoutDrawer?.showPaymentMethods} onChange={(v) => update('checkoutDrawer', 'showPaymentMethods', v)} />
          <Toggle label="Show Order Summary" checked={s.checkoutDrawer?.showOrderSummary} onChange={(v) => update('checkoutDrawer', 'showOrderSummary', v)} />
          <Toggle label="Show Coupon Field" checked={s.checkoutDrawer?.showCouponField} onChange={(v) => update('checkoutDrawer', 'showCouponField', v)} />
          <Toggle label="Show Laybye Option" checked={s.checkoutDrawer?.showLaybyeOption} onChange={(v) => update('checkoutDrawer', 'showLaybyeOption', v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Field label="Delivery Label" type="text" value={s.checkoutDrawer?.deliveryLabel} onChange={(v) => update('checkoutDrawer', 'deliveryLabel', v)} />
          <Field label="Pickup Label" type="text" value={s.checkoutDrawer?.pickupLabel} onChange={(v) => update('checkoutDrawer', 'pickupLabel', v)} />
        </div>

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Pickup Addresses (Branches)</h4>
        <p className="text-xs text-gray-500 mb-2">Add all your branch/store locations. Customers will choose one when selecting pickup at checkout.</p>
        <ListEditor
          items={s.checkoutDrawer?.pickupAddresses || []}
          onChange={(v) => update('checkoutDrawer', 'pickupAddresses', v)}
          fields={[
            { key: 'label', label: 'Branch Name', placeholder: 'Main Branch — Harare' },
            { key: 'address', label: 'Full Address', placeholder: '24 Kaguvi St, Harare' },
            { key: 'enabled', label: 'Active', type: 'toggle', default: true },
          ]}
          addLabel="Add pickup location"
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Payment Methods</h4>
        <p className="text-xs text-gray-500 mb-2">Configure which payment methods appear at checkout. Choose emoji/icon, text only, or upload your own logo image for each method.</p>
        <PaymentMethodEditor
          items={s.checkoutDrawer?.paymentMethods || []}
          onChange={(v) => update('checkoutDrawer', 'paymentMethods', v)}
        />

        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Checkout Form Fields</h4>
        <div className="space-y-2">
          {(s.checkoutDrawer?.fields || []).sort((a, b) => a.order - b.order).map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => {
                  const sorted = [...(s.checkoutDrawer?.fields || [])].sort((a, b) => a.order - b.order);
                  if (idx === 0) return;
                  [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
                  sorted.forEach((item, i) => { item.order = i; });
                  update('checkoutDrawer', 'fields', sorted);
                }} className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
                <button onClick={() => {
                  const sorted = [...(s.checkoutDrawer?.fields || [])].sort((a, b) => a.order - b.order);
                  if (idx >= sorted.length - 1) return;
                  [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
                  sorted.forEach((item, i) => { item.order = i; });
                  update('checkoutDrawer', 'fields', sorted);
                }} className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
              </div>
              <Toggle label="" checked={field.enabled} onChange={(v) => {
                const updated = [...(s.checkoutDrawer?.fields || [])];
                const t = updated.find(f => f.id === field.id);
                if (t) t.enabled = v;
                update('checkoutDrawer', 'fields', updated);
              }} />
              <span className="text-xs font-mono text-gray-400 w-20">{field.id}</span>
              <input
                type="text"
                value={field.label}
                onChange={(e) => {
                  const updated = [...(s.checkoutDrawer?.fields || [])];
                  const t = updated.find(f => f.id === field.id);
                  if (t) t.label = e.target.value;
                  update('checkoutDrawer', 'fields', updated);
                }}
                className="flex-1 px-2 py-1 border border-gray-300 text-xs"
              />
              <select
                value={field.type}
                onChange={(e) => {
                  const updated = [...(s.checkoutDrawer?.fields || [])];
                  const t = updated.find(f => f.id === field.id);
                  if (t) t.type = e.target.value;
                  update('checkoutDrawer', 'fields', updated);
                }}
                className="px-1 py-1 border border-gray-300 text-xs w-20"
              >
                <option value="text">text</option>
                <option value="email">email</option>
                <option value="tel">tel</option>
                <option value="select">select</option>
                <option value="textarea">textarea</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => {
                    const updated = [...(s.checkoutDrawer?.fields || [])];
                    const t = updated.find(f => f.id === field.id);
                    if (t) t.required = e.target.checked;
                    update('checkoutDrawer', 'fields', updated);
                  }}
                />
                Req
              </label>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ BADGES ═══ */}
      <Section title="Badges" description="Product badge display settings">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Enable Badges" checked={s.badges?.enabled} onChange={(v) => update('badges', 'enabled', v)} />
          <Field label="Badge Source" type="select" value={s.badges?.source} onChange={(v) => update('badges', 'source', v)} options={['auto', 'manual', 'badge-module', 'all']} />
          <Toggle label="Show on Gallery" checked={s.badges?.showOnGallery} onChange={(v) => update('badges', 'showOnGallery', v)} />
          <Toggle label="Show on Product Info" checked={s.badges?.showOnProductInfo} onChange={(v) => update('badges', 'showOnProductInfo', v)} />
          <Toggle label="Sale Badge" checked={s.badges?.showSaleBadge} onChange={(v) => update('badges', 'showSaleBadge', v)} />
          <Toggle label="New Badge" checked={s.badges?.showNewBadge} onChange={(v) => update('badges', 'showNewBadge', v)} />
          <Toggle label="Out of Stock Badge" checked={s.badges?.showOutOfStockBadge} onChange={(v) => update('badges', 'showOutOfStockBadge', v)} />
          <Toggle label="Featured Badge" checked={s.badges?.showFeaturedBadge} onChange={(v) => update('badges', 'showFeaturedBadge', v)} />
          <Toggle label="Custom Badges" checked={s.badges?.showCustomBadges} onChange={(v) => update('badges', 'showCustomBadges', v)} />
        </div>
      </Section>

      {/* ═══ CONVERSION ENHANCERS ═══ */}
      <Section title="Conversion Enhancers" description="Social proof, urgency, exit intent, and more">
        {/* Social Proof Toasts */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Social Proof Toasts</h4>
          <Toggle label="Enable Social Proof Toasts" checked={s.conversionEnhancers?.socialProofToasts?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'socialProofToasts', 'enabled', v)} />
          <div className="grid grid-cols-3 gap-3 mt-2">
            <Field label="Interval (ms)" type="number" value={s.conversionEnhancers?.socialProofToasts?.intervalMs} onChange={(v) => updateDeep('conversionEnhancers', 'socialProofToasts', 'intervalMs', v)} />
            <Field label="Initial Delay (ms)" type="number" value={s.conversionEnhancers?.socialProofToasts?.initialDelayMs} onChange={(v) => updateDeep('conversionEnhancers', 'socialProofToasts', 'initialDelayMs', v)} />
            <Field label="Display Duration (ms)" type="number" value={s.conversionEnhancers?.socialProofToasts?.displayDurationMs} onChange={(v) => updateDeep('conversionEnhancers', 'socialProofToasts', 'displayDurationMs', v)} />
          </div>
        </div>

        {/* Urgency */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Urgency Indicators</h4>
          <Toggle label="Enable Urgency" checked={s.conversionEnhancers?.urgency?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'enabled', v)} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Toggle label="Low Stock Warning" checked={s.conversionEnhancers?.urgency?.showLowStockWarning} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'showLowStockWarning', v)} />
            <Field label="Low Stock Message" type="text" value={s.conversionEnhancers?.urgency?.lowStockMessage} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'lowStockMessage', v)} />
            <Toggle label="Viewer Count" checked={s.conversionEnhancers?.urgency?.showViewerCount} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'showViewerCount', v)} />
            <Field label="Viewer Count Message" type="text" value={s.conversionEnhancers?.urgency?.viewerCountMessage} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'viewerCountMessage', v)} />
            <Field label="Viewer Min" type="number" value={s.conversionEnhancers?.urgency?.viewerCountMin} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'viewerCountMin', v)} />
            <Field label="Viewer Max" type="number" value={s.conversionEnhancers?.urgency?.viewerCountMax} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'viewerCountMax', v)} />
            <Toggle label="Recent Purchase Count" checked={s.conversionEnhancers?.urgency?.showRecentPurchaseCount} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'showRecentPurchaseCount', v)} />
            <Field label="Purchase Message" type="text" value={s.conversionEnhancers?.urgency?.recentPurchaseMessage} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'recentPurchaseMessage', v)} />
            <Field label="Purchase Min" type="number" value={s.conversionEnhancers?.urgency?.recentPurchaseMin} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'recentPurchaseMin', v)} />
            <Field label="Purchase Max" type="number" value={s.conversionEnhancers?.urgency?.recentPurchaseMax} onChange={(v) => updateDeep('conversionEnhancers', 'urgency', 'recentPurchaseMax', v)} />
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Countdown Timer</h4>
          <p className="text-xs text-gray-500 mb-2">The countdown uses each product's Sale End Date (set on the product form). The global end date below is a fallback for products without their own sale end date.</p>
          <Toggle label="Enable Countdown" checked={s.conversionEnhancers?.countdownTimer?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'countdownTimer', 'enabled', v)} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Label" type="text" value={s.conversionEnhancers?.countdownTimer?.label} onChange={(v) => updateDeep('conversionEnhancers', 'countdownTimer', 'label', v)} />
            <Toggle label="Show on Sale Products Only" checked={s.conversionEnhancers?.countdownTimer?.showOnSaleOnly} onChange={(v) => updateDeep('conversionEnhancers', 'countdownTimer', 'showOnSaleOnly', v)} />
            <Field
              label="Global End Date & Time (fallback)"
              type="datetime-local"
              value={s.conversionEnhancers?.countdownTimer?.endDate
                ? new Date(s.conversionEnhancers.countdownTimer.endDate).toISOString().slice(0, 16)
                : ''}
              onChange={(v) => updateDeep('conversionEnhancers', 'countdownTimer', 'endDate', v ? new Date(v).toISOString() : null)}
            />
          </div>
        </div>

        {/* Exit Intent */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Exit Intent Popup</h4>
          <Toggle label="Enable Exit Intent" checked={s.conversionEnhancers?.exitIntent?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'enabled', v)} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Title" type="text" value={s.conversionEnhancers?.exitIntent?.title} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'title', v)} />
            <Field label="Subtitle" type="text" value={s.conversionEnhancers?.exitIntent?.subtitle} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'subtitle', v)} />
            <Field label="Coupon Code" type="text" value={s.conversionEnhancers?.exitIntent?.couponCode} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'couponCode', v)} />
            <Field label="Discount Text" type="text" value={s.conversionEnhancers?.exitIntent?.discountText} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'discountText', v)} />
            <Field label="Expiry Seconds" type="number" value={s.conversionEnhancers?.exitIntent?.expirySeconds} onChange={(v) => updateDeep('conversionEnhancers', 'exitIntent', 'expirySeconds', v)} />
          </div>
        </div>

        {/* Free Shipping Bar */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Free Shipping Progress Bar</h4>
          <p className="text-xs text-gray-500 mb-2">
            Enter the threshold in your store's <strong>base currency (ZAR)</strong>. The remaining amount shown to customers is automatically converted to whatever currency they're viewing — so a customer in the UK will see the correct GBP equivalent.
            The bar turns <span className="text-red-500 font-semibold">red → orange → green</span> as the customer gets closer.
          </p>
          <Toggle label="Enable" checked={s.conversionEnhancers?.freeShippingBar?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'freeShippingBar', 'enabled', v)} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Threshold (ZAR — base currency)" type="number" value={s.conversionEnhancers?.freeShippingBar?.threshold} onChange={(v) => updateDeep('conversionEnhancers', 'freeShippingBar', 'threshold', v)} />
            <Field
              label="Show In"
              type="select"
              value={s.conversionEnhancers?.freeShippingBar?.showIn || 'info'}
              onChange={(v) => updateDeep('conversionEnhancers', 'freeShippingBar', 'showIn', v)}
              options={[
                { value: 'info', label: 'Product Information box only' },
                { value: 'fulfillment', label: 'Fulfillment box only (above Buy Now)' },
                { value: 'both', label: 'Both boxes' },
              ]}
            />
            <Field label="Message (use {remaining} placeholder)" type="text" value={s.conversionEnhancers?.freeShippingBar?.message} onChange={(v) => updateDeep('conversionEnhancers', 'freeShippingBar', 'message', v)} />
            <Field label="Completed Message" type="text" value={s.conversionEnhancers?.freeShippingBar?.completedMessage} onChange={(v) => updateDeep('conversionEnhancers', 'freeShippingBar', 'completedMessage', v)} />
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Recently Viewed</h4>
          <Toggle label="Enable" checked={s.conversionEnhancers?.recentlyViewed?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'recentlyViewed', 'enabled', v)} />
          <Field label="Max Items" type="number" value={s.conversionEnhancers?.recentlyViewed?.maxItems} onChange={(v) => updateDeep('conversionEnhancers', 'recentlyViewed', 'maxItems', v)} min={1} max={20} />
        </div>

        {/* Sticky Mobile Bar */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Sticky Mobile Add-to-Cart Bar</h4>
          <div className="grid grid-cols-2 gap-3">
            <Toggle label="Enable" checked={s.conversionEnhancers?.stickyMobileBar?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'stickyMobileBar', 'enabled', v)} />
            <Toggle label="Show Price" checked={s.conversionEnhancers?.stickyMobileBar?.showPrice} onChange={(v) => updateDeep('conversionEnhancers', 'stickyMobileBar', 'showPrice', v)} />
            <Toggle label="Show Image" checked={s.conversionEnhancers?.stickyMobileBar?.showImage} onChange={(v) => updateDeep('conversionEnhancers', 'stickyMobileBar', 'showImage', v)} />
            <Toggle label="Show Rating" checked={s.conversionEnhancers?.stickyMobileBar?.showRating} onChange={(v) => updateDeep('conversionEnhancers', 'stickyMobileBar', 'showRating', v)} />
          </div>
        </div>

        {/* Price Match Guarantee */}
        <div className="p-4 border border-gray-200 bg-gray-50 mb-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Price Match Guarantee</h4>
          <Toggle label="Enable" checked={s.conversionEnhancers?.priceMatchGuarantee?.enabled} onChange={(v) => updateDeep('conversionEnhancers', 'priceMatchGuarantee', 'enabled', v)} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Text" type="text" value={s.conversionEnhancers?.priceMatchGuarantee?.text} onChange={(v) => updateDeep('conversionEnhancers', 'priceMatchGuarantee', 'text', v)} />
            <Field label="Icon" type="text" value={s.conversionEnhancers?.priceMatchGuarantee?.icon} onChange={(v) => updateDeep('conversionEnhancers', 'priceMatchGuarantee', 'icon', v)} />
          </div>
        </div>
      </Section>

      {/* ═══ FAKE / SEED DATA ═══ */}
      <Section title="Fake / Seed Data" description="Generate randomized display data for new stores with little real activity">
        <p className="text-xs text-gray-500 mb-3">These settings generate random numbers within the min/max range for each product. This is display-only and does not modify the database. When real stats data exists, it takes priority.</p>
        <Toggle label="Enable Fake Data" sublabel="Show simulated views, reviews, and sold counts when real data is unavailable" checked={s.fakeData?.enabled} onChange={(v) => update('fakeData', 'enabled', v)} />

        <div className="p-4 border border-gray-200 bg-gray-50 mt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Simulated Review Count</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Reviews" type="number" value={s.fakeData?.reviewCountMin} onChange={(v) => update('fakeData', 'reviewCountMin', v)} min={0} max={500} />
            <Field label="Max Reviews" type="number" value={s.fakeData?.reviewCountMax} onChange={(v) => update('fakeData', 'reviewCountMax', v)} min={0} max={2000} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 bg-gray-50 mt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Simulated Rating</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Rating (1-5)" type="number" value={s.fakeData?.ratingMin} onChange={(v) => update('fakeData', 'ratingMin', v)} min={1} max={5} />
            <Field label="Max Rating (1-5)" type="number" value={s.fakeData?.ratingMax} onChange={(v) => update('fakeData', 'ratingMax', v)} min={1} max={5} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 bg-gray-50 mt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Simulated View Count</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Views" type="number" value={s.fakeData?.viewCountMin} onChange={(v) => update('fakeData', 'viewCountMin', v)} min={0} max={5000} />
            <Field label="Max Views" type="number" value={s.fakeData?.viewCountMax} onChange={(v) => update('fakeData', 'viewCountMax', v)} min={0} max={50000} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 bg-gray-50 mt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Simulated Sold Count</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Sold" type="number" value={s.fakeData?.soldCountMin} onChange={(v) => update('fakeData', 'soldCountMin', v)} min={0} max={1000} />
            <Field label="Max Sold" type="number" value={s.fakeData?.soldCountMax} onChange={(v) => update('fakeData', 'soldCountMax', v)} min={0} max={10000} />
          </div>
        </div>

        <div className="p-4 border border-gray-200 bg-gray-50 mt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Display Format</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sold Text Template" type="text" value={s.fakeData?.soldTextTemplate} onChange={(v) => update('fakeData', 'soldTextTemplate', v)} placeholder="{count}+ bought since yesterday" />
            <Field label="View Text Template" type="text" value={s.fakeData?.viewTextTemplate} onChange={(v) => update('fakeData', 'viewTextTemplate', v)} placeholder="{count} people viewed this" />
          </div>
        </div>
      </Section>

      {/* ═══ REVIEWS ═══ */}
      <Section title="Reviews Section" description="Review display configuration">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Show Bar Chart" checked={s.reviewsConfig?.showBarChart} onChange={(v) => update('reviewsConfig', 'showBarChart', v)} />
          <Toggle label="Show Write Review" checked={s.reviewsConfig?.showWriteReview} onChange={(v) => update('reviewsConfig', 'showWriteReview', v)} />
          <Toggle label="Show Verified Badge" checked={s.reviewsConfig?.showVerifiedBadge} onChange={(v) => update('reviewsConfig', 'showVerifiedBadge', v)} />
          <Toggle label="Show Photo Reviews" checked={s.reviewsConfig?.showPhotoReviews} onChange={(v) => update('reviewsConfig', 'showPhotoReviews', v)} />
          <Toggle label="Show Helpful Votes" checked={s.reviewsConfig?.showHelpfulVotes} onChange={(v) => update('reviewsConfig', 'showHelpfulVotes', v)} />
          <Field label="Default Sort" type="select" value={s.reviewsConfig?.sortDefault} onChange={(v) => update('reviewsConfig', 'sortDefault', v)} options={['newest', 'highest', 'lowest', 'helpful']} />
          <Field label="Reviews Per Page" type="number" value={s.reviewsConfig?.perPage} onChange={(v) => update('reviewsConfig', 'perPage', v)} min={1} max={50} />
        </div>
      </Section>

      {/* ═══ SEO ═══ */}
      <Section title="SEO & Structured Data" description="Schema.org and Open Graph settings">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="JSON-LD Product Schema" checked={s.seo?.enableJsonLd} onChange={(v) => update('seo', 'enableJsonLd', v)} />
          <Toggle label="Open Graph Tags" checked={s.seo?.enableOpenGraph} onChange={(v) => update('seo', 'enableOpenGraph', v)} />
          <Toggle label="Breadcrumb Schema" checked={s.seo?.enableBreadcrumbSchema} onChange={(v) => update('seo', 'enableBreadcrumbSchema', v)} />
          <Toggle label="Product Schema" checked={s.seo?.enableProductSchema} onChange={(v) => update('seo', 'enableProductSchema', v)} />
          <Toggle label="FAQ Schema" checked={s.seo?.enableFaqSchema} onChange={(v) => update('seo', 'enableFaqSchema', v)} />
        </div>
      </Section>

      {/* ═══ MOBILE ═══ */}
      <Section title="Mobile Overrides" description="Mobile-specific settings">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gallery Height" type="text" value={s.mobile?.galleryHeight} onChange={(v) => update('mobile', 'galleryHeight', v)} />
          <Toggle label="Accordion Sections" checked={s.mobile?.showAccordionSections} onChange={(v) => update('mobile', 'showAccordionSections', v)} />
          <Toggle label="Full Width Buttons" checked={s.mobile?.fullWidthButtons} onChange={(v) => update('mobile', 'fullWidthButtons', v)} />
          <Toggle label="Sticky Bottom Bar" checked={s.mobile?.showStickyBottomBar} onChange={(v) => update('mobile', 'showStickyBottomBar', v)} />
          <Toggle label="Compact Product Info" checked={s.mobile?.compactProductInfo} onChange={(v) => update('mobile', 'compactProductInfo', v)} />
        </div>
      </Section>

      {/* ═══ THEME ═══ */}
      <Section title="Theme / Brand Colors" description="Colors, fonts, and visual style">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Primary Color" type="color" value={s.theme?.primaryColor} onChange={(v) => update('theme', 'primaryColor', v)} />
          <Field label="Secondary Color" type="color" value={s.theme?.secondaryColor} onChange={(v) => update('theme', 'secondaryColor', v)} />
          <Field label="Accent Color" type="color" value={s.theme?.accentColor} onChange={(v) => update('theme', 'accentColor', v)} />
          <Field label="Danger Color" type="color" value={s.theme?.dangerColor} onChange={(v) => update('theme', 'dangerColor', v)} />
          <Field label="Text Color" type="color" value={s.theme?.textColor} onChange={(v) => update('theme', 'textColor', v)} />
          <Field label="Muted Color" type="color" value={s.theme?.mutedColor} onChange={(v) => update('theme', 'mutedColor', v)} />
          <Field label="Background" type="color" value={s.theme?.bgColor} onChange={(v) => update('theme', 'bgColor', v)} />
          <Field label="Card Background" type="color" value={s.theme?.cardBg} onChange={(v) => update('theme', 'cardBg', v)} />
          <Field label="Border Color" type="color" value={s.theme?.borderColor} onChange={(v) => update('theme', 'borderColor', v)} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <Field label="Heading Font" type="text" value={s.theme?.headingFont} onChange={(v) => update('theme', 'headingFont', v)} />
          <Field label="Body Font" type="text" value={s.theme?.bodyFont} onChange={(v) => update('theme', 'bodyFont', v)} />
          <Field label="Border Radius (px)" type="number" value={s.theme?.borderRadius} onChange={(v) => update('theme', 'borderRadius', v)} min={0} max={24} />
        </div>
      </Section>

      {/* Sticky Save Bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-6 py-3 flex items-center justify-end gap-4 z-50 shadow-lg">
          <span className="text-sm text-gray-500">You have unsaved changes</span>
          <button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isLoading}
            className="px-6 py-2 bg-green-700 text-white font-bold text-sm hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
