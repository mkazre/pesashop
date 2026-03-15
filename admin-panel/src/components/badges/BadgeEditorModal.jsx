import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import {
  IoClose, IoSave, IoTrash, IoAdd, IoImage, IoText, IoCode,
  IoChevronDown, IoChevronUp, IoInformationCircle
} from 'react-icons/io5';
import { useAuthStore } from '@/store';
import BadgePreview from './BadgePreview';
import MediaLibraryModal from '@/components/media/MediaLibraryModal';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary';
const selectCls = inputCls;
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const sectionCls = 'space-y-3 p-4 bg-gray-50 rounded-lg';

const CONDITION_TYPES = [
  { group: 'Sales & Pricing', items: [
    { value: 'on_sale', label: 'On Sale', desc: 'Product has active sale price' },
    { value: 'percentage_off', label: 'Percentage Off', desc: 'Discount % >= threshold' },
    { value: 'price_range', label: 'Price Range', desc: 'Price between min and max' },
    { value: 'clearance', label: 'Clearance', desc: 'Tagged as clearance' },
  ]},
  { group: 'Popularity & Social Proof', items: [
    { value: 'top_selling', label: 'Top Selling', desc: 'Sales count >= threshold' },
    { value: 'high_rated', label: 'High Rated', desc: 'Rating >= threshold' },
    { value: 'most_reviewed', label: 'Most Reviewed', desc: 'Review count >= threshold' },
    { value: 'featured', label: 'Featured', desc: 'Marked as featured' },
  ]},
  { group: 'Stock & Availability', items: [
    { value: 'new_arrival', label: 'New Arrival', desc: 'Added within X days' },
    { value: 'low_stock', label: 'Low Stock', desc: 'Stock <= threshold' },
    { value: 'out_of_stock', label: 'Out of Stock', desc: 'Stock is 0' },
    { value: 'back_in_stock', label: 'Back in Stock', desc: 'Recently restocked' },
    { value: 'limited_edition', label: 'Limited Edition', desc: 'Low stock + limited tag' },
    { value: 'pre_order', label: 'Pre-Order', desc: 'Available for pre-order' },
  ]},
  { group: 'Special', items: [
    { value: 'free_shipping', label: 'Free Shipping', desc: 'Qualifies for free shipping' },
    { value: 'bundle_deal', label: 'Bundle Deal', desc: 'Part of a bundle' },
    { value: 'member_only', label: 'Member Only', desc: 'Requires membership' },
    { value: 'seasonal', label: 'Seasonal', desc: 'Active during date range' },
  ]},
  { group: 'Selection', items: [
    { value: 'specific_products', label: 'Specific Products', desc: 'Manually selected products' },
    { value: 'specific_categories', label: 'Specific Categories', desc: 'Products in categories' },
    { value: 'specific_tags', label: 'Specific Tags', desc: 'Products with tags' },
    { value: 'specific_brands', label: 'Specific Brands', desc: 'Products of brands' },
  ]},
  { group: 'Category-Level', items: [
    { value: 'category_sale', label: 'Category Sale', desc: 'Category on sale' },
    { value: 'category_featured', label: 'Category Featured', desc: 'Featured category' },
  ]},
  { group: 'Time & Custom', items: [
    { value: 'static', label: 'Static', desc: 'Always show' },
    { value: 'scheduled', label: 'Scheduled', desc: 'Show during date range' },
    { value: 'custom_field', label: 'Custom Field', desc: 'Match product field' },
  ]},
];

const POSITIONS = [
  { value: 'top-left', label: '↖ Top Left' },
  { value: 'top-center', label: '↑ Top Center' },
  { value: 'top-right', label: '↗ Top Right' },
  { value: 'middle-left', label: '← Middle Left' },
  { value: 'middle-center', label: '⊕ Center' },
  { value: 'middle-right', label: '→ Middle Right' },
  { value: 'bottom-left', label: '↙ Bottom Left' },
  { value: 'bottom-center', label: '↓ Bottom Center' },
  { value: 'bottom-right', label: '↘ Bottom Right' },
  { value: 'custom', label: '✎ Custom' },
];

const SHAPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'circle', label: 'Circle' },
  { value: 'ribbon-left', label: 'Ribbon Left' },
  { value: 'ribbon-right', label: 'Ribbon Right' },
  { value: 'banner', label: 'Banner' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'star-burst', label: 'Star Burst' },
];

const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'shake', label: 'Shake' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-in', label: 'Slide In' },
  { value: 'glow', label: 'Glow' },
  { value: 'wiggle', label: 'Wiggle' },
  { value: 'flip', label: 'Flip' },
];

const TEXT_PRESETS = [
  'Sale', 'New', 'Hot', 'Best Seller', 'Top Rated', 'Limited',
  'Free Shipping', 'Clearance', 'Exclusive', 'Pre-Order',
  'Back in Stock', 'Low Stock', 'Bundle', 'Members Only',
  '-10%', '-20%', '-30%', '-50%', 'BOGO', 'Flash Sale',
  'Holiday Special', 'Gift Idea', 'Trending', 'Editor\'s Pick',
];

const COLOR_PRESETS = [
  { name: 'Red', bg: '#ef4444', text: '#ffffff' },
  { name: 'Orange', bg: '#f97316', text: '#ffffff' },
  { name: 'Amber', bg: '#f59e0b', text: '#000000' },
  { name: 'Green', bg: '#22c55e', text: '#ffffff' },
  { name: 'Teal', bg: '#14b8a6', text: '#ffffff' },
  { name: 'Blue', bg: '#3b82f6', text: '#ffffff' },
  { name: 'Indigo', bg: '#6366f1', text: '#ffffff' },
  { name: 'Purple', bg: '#a855f7', text: '#ffffff' },
  { name: 'Pink', bg: '#ec4899', text: '#ffffff' },
  { name: 'Rose', bg: '#f43f5e', text: '#ffffff' },
  { name: 'Black', bg: '#000000', text: '#ffffff' },
  { name: 'White', bg: '#ffffff', text: '#000000' },
  { name: 'Gold', bg: '#d4a017', text: '#000000' },
  { name: 'Silver', bg: '#94a3b8', text: '#ffffff' },
];

const GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#f43f5e', to: '#f97316', dir: '135deg' },
  { name: 'Ocean', from: '#3b82f6', to: '#06b6d4', dir: '135deg' },
  { name: 'Forest', from: '#22c55e', to: '#14b8a6', dir: '135deg' },
  { name: 'Royal', from: '#6366f1', to: '#a855f7', dir: '135deg' },
  { name: 'Night', from: '#1e293b', to: '#6366f1', dir: '135deg' },
  { name: 'Flame', from: '#ef4444', to: '#f59e0b', dir: '90deg' },
  { name: 'Candy', from: '#ec4899', to: '#a855f7', dir: '135deg' },
  { name: 'Lime', from: '#84cc16', to: '#22c55e', dir: '135deg' },
];

const DEFAULT_STYLE = {
  badgeType: 'text',
  text: 'Sale',
  textColor: '#ffffff',
  backgroundColor: '#ef4444',
  fontSize: '12px',
  fontWeight: '700',
  fontFamily: '',
  fontStyle: 'normal',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: '1',
  imageUrl: '',
  imageWidth: '60px',
  imageHeight: 'auto',
  imageObjectFit: 'contain',
  htmlContent: '',
  position: 'top-right',
  customTop: '', customRight: '', customBottom: '', customLeft: '',
  zIndex: 10,
  width: 'auto', height: 'auto', minWidth: '', maxWidth: '',
  paddingTop: '4px', paddingRight: '10px', paddingBottom: '4px', paddingLeft: '10px',
  marginTop: '8px', marginRight: '8px', marginBottom: '0px', marginLeft: '0px',
  borderRadius: '4px',
  borderTopLeftRadius: '', borderTopRightRadius: '', borderBottomRightRadius: '', borderBottomLeftRadius: '',
  borderWidth: '0px', borderStyle: 'solid', borderColor: 'transparent',
  boxShadow: '',
  rotate: '0deg', scale: '1', translateX: '0px', translateY: '0px', skewX: '0deg', skewY: '0deg',
  opacity: '1', backdropFilter: '', filter: '', mixBlendMode: 'normal',
  animation: 'none', animationDuration: '1s',
  shape: 'rounded',
  useGradient: false, gradientFrom: '#ef4444', gradientTo: '#f97316', gradientDirection: '135deg',
  customCSS: '',
};

const DEFAULT_BADGE = {
  name: '',
  description: '',
  isActive: true,
  priority: 10,
  conditions: [],
  conditionLogic: 'all',
  style: { ...DEFAULT_STYLE },
  displayOn: {
    productCards: true, productPages: true, categoryPages: false,
    cartItems: false, searchResults: true, pageBuilder: true,
  },
  assignedProducts: [],
  assignedCategories: [],
  startDate: '',
  endDate: '',
};

// ── Collapsible Section ──────────────────────────────────────────────────────
const Section = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-left">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        {open ? <IoChevronUp size={14} className="text-gray-400" /> : <IoChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const BadgeEditorModal = ({ badge: existingBadge, onClose, onSaved }) => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [badge, setBadge] = useState(() => {
    if (existingBadge) {
      return {
        ...DEFAULT_BADGE,
        ...existingBadge,
        style: { ...DEFAULT_STYLE, ...(existingBadge.style || {}) },
        displayOn: { ...DEFAULT_BADGE.displayOn, ...(existingBadge.displayOn || {}) },
        startDate: existingBadge.startDate ? new Date(existingBadge.startDate).toISOString().slice(0, 16) : '',
        endDate: existingBadge.endDate ? new Date(existingBadge.endDate).toISOString().slice(0, 16) : '',
      };
    }
    return { ...DEFAULT_BADGE };
  });

  // Fetch products and categories for selection
  const { data: productsData } = useQuery('products-for-badges', async () => {
    const res = await fetch(`${API}/products?limit=500&status=active`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  });
  const { data: categoriesData } = useQuery('categories-for-badges', async () => {
    const res = await fetch(`${API}/categories?limit=500`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  });

  const products = productsData?.data || productsData?.products || [];
  const categories = categoriesData?.data || categoriesData?.categories || [];

  const updateField = (key, value) => setBadge((prev) => ({ ...prev, [key]: value }));
  const updateStyle = (key, value) => setBadge((prev) => ({ ...prev, style: { ...prev.style, [key]: value } }));
  const updateDisplayOn = (key, value) => setBadge((prev) => ({ ...prev, displayOn: { ...prev.displayOn, [key]: value } }));

  const addCondition = (type) => {
    setBadge((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { type, threshold: 10, days: 30, minValue: 0, maxValue: 100, productIds: [], categoryIds: [], tags: [], brands: [] }],
    }));
  };

  const updateCondition = (index, key, value) => {
    setBadge((prev) => {
      const conds = [...prev.conditions];
      conds[index] = { ...conds[index], [key]: value };
      return { ...prev, conditions: conds };
    });
  };

  const removeCondition = (index) => {
    setBadge((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!badge.name.trim()) {
      toast.error('Badge name is required');
      return;
    }
    setSaving(true);
    try {
      const url = existingBadge ? `${API}/badges/${existingBadge._id}` : `${API}/badges`;
      const method = existingBadge ? 'PUT' : 'POST';
      const payload = { ...badge };
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      else payload.startDate = null;
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      else payload.endDate = null;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to save badge');
      toast.success(existingBadge ? 'Badge updated' : 'Badge created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'styling', label: 'Styling' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{existingBadge ? 'Edit Badge' : 'Create Badge'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Design your badge, set conditions, and configure display options</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              <IoSave size={14} />
              {saving ? 'Saving...' : 'Save Badge'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <IoClose size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body — two columns: settings + live preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Settings column */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'conditions' && renderConditionsTab()}
            {activeTab === 'styling' && renderStylingTab()}
            {activeTab === 'advanced' && renderAdvancedTab()}
          </div>

          {/* Live preview column */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 shrink-0 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Preview</h3>
            <BadgePreview badge={badge} size="lg" />
            <div className="mt-4">
              <BadgePreview badge={badge} size="sm" className="mb-2" />
              <p className="text-[10px] text-gray-400 mt-1">Inline preview (table/list)</p>
            </div>
          </div>
        </div>
      </div>

      {mediaModalOpen && (
        <MediaLibraryModal
          onSelect={(media) => {
            updateStyle('imageUrl', media.url?.startsWith('/') ? `${window.location.origin.replace(':3001', ':5000')}${media.url}` : media.url);
            setMediaModalOpen(false);
          }}
          onClose={() => setMediaModalOpen(false)}
        />
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── TAB: General ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  function renderGeneralTab() {
    return (
      <>
        <Section title="Basic Info">
          <div>
            <label className={labelCls}>Badge Name *</label>
            <input type="text" value={badge.name} onChange={(e) => updateField('name', e.target.value)} className={inputCls} placeholder="e.g. Summer Sale Badge" />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={badge.description} onChange={(e) => updateField('description', e.target.value)} className={inputCls} rows={2} placeholder="Optional internal description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority (higher = shown first)</label>
              <input type="number" value={badge.priority} onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={badge.isActive ? 'active' : 'inactive'} onChange={(e) => updateField('isActive', e.target.value === 'active')} className={selectCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Scheduling" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date (optional)</label>
              <input type="datetime-local" value={badge.startDate} onChange={(e) => updateField('startDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date (optional)</label>
              <input type="datetime-local" value={badge.endDate} onChange={(e) => updateField('endDate', e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Leave empty for no time restriction</p>
        </Section>

        <Section title="Display Locations" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'productCards', label: 'Product Cards (Grid)' },
              { key: 'productPages', label: 'Product Detail Pages' },
              { key: 'categoryPages', label: 'Category Pages' },
              { key: 'searchResults', label: 'Search Results' },
              { key: 'cartItems', label: 'Cart Items' },
              { key: 'pageBuilder', label: 'Page Builder Elements' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={badge.displayOn[key]} onChange={(e) => updateDisplayOn(key, e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Manual Assignments" defaultOpen={false}>
          <div>
            <label className={labelCls}>Assign to Specific Products</label>
            <select
              multiple
              value={badge.assignedProducts?.map(p => typeof p === 'object' ? p._id : p) || []}
              onChange={(e) => updateField('assignedProducts', Array.from(e.target.selectedOptions, (o) => o.value))}
              className={`${inputCls} h-32`}
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
          <div>
            <label className={labelCls}>Assign to Categories</label>
            <select
              multiple
              value={badge.assignedCategories?.map(c => typeof c === 'object' ? c._id : c) || []}
              onChange={(e) => updateField('assignedCategories', Array.from(e.target.selectedOptions, (o) => o.value))}
              className={`${inputCls} h-28`}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </Section>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── TAB: Conditions ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  function renderConditionsTab() {
    return (
      <>
        <Section title="Condition Logic">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">When conditions match:</label>
            <select value={badge.conditionLogic} onChange={(e) => updateField('conditionLogic', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="all">ALL conditions (AND)</option>
              <option value="any">ANY condition (OR)</option>
            </select>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <IoInformationCircle size={16} className="shrink-0 mt-0.5" />
            <p><strong>AND</strong> = product must match every condition. <strong>OR</strong> = product matches if any one condition is true. Use multiple badges for complex logic.</p>
          </div>
        </Section>

        <Section title="Active Conditions">
          {badge.conditions.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No conditions set</p>
              <p className="text-xs mt-1">Badge will only show on manually assigned products/categories</p>
            </div>
          ) : (
            <div className="space-y-3">
              {badge.conditions.map((cond, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {CONDITION_TYPES.flatMap(g => g.items).find(t => t.value === cond.type)?.label || cond.type}
                    </span>
                    <button onClick={() => removeCondition(i)} className="p-1 hover:bg-red-50 rounded text-red-500">
                      <IoTrash size={14} />
                    </button>
                  </div>
                  {renderConditionFields(cond, i)}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Add Condition">
          <div className="space-y-3">
            {CONDITION_TYPES.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{group.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => addCondition(item.value)}
                      className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                      title={item.desc}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  }

  function renderConditionFields(cond, i) {
    const update = (key, val) => updateCondition(i, key, val);
    switch (cond.type) {
      case 'top_selling':
      case 'most_reviewed':
        return (
          <div>
            <label className={labelCls}>Minimum Count</label>
            <input type="number" value={cond.threshold || ''} onChange={(e) => update('threshold', parseInt(e.target.value) || 0)} className={inputCls} placeholder="10" />
          </div>
        );
      case 'high_rated':
        return (
          <div>
            <label className={labelCls}>Minimum Rating (1-5)</label>
            <input type="number" min="1" max="5" step="0.5" value={cond.threshold || ''} onChange={(e) => update('threshold', parseFloat(e.target.value) || 0)} className={inputCls} placeholder="4" />
          </div>
        );
      case 'new_arrival':
      case 'back_in_stock':
        return (
          <div>
            <label className={labelCls}>Within last X days</label>
            <input type="number" value={cond.days || ''} onChange={(e) => update('days', parseInt(e.target.value) || 0)} className={inputCls} placeholder="30" />
          </div>
        );
      case 'low_stock':
      case 'limited_edition':
        return (
          <div>
            <label className={labelCls}>Stock Threshold</label>
            <input type="number" value={cond.threshold || ''} onChange={(e) => update('threshold', parseInt(e.target.value) || 0)} className={inputCls} placeholder="5" />
          </div>
        );
      case 'percentage_off':
        return (
          <div>
            <label className={labelCls}>Minimum Discount %</label>
            <input type="number" value={cond.threshold || ''} onChange={(e) => update('threshold', parseInt(e.target.value) || 0)} className={inputCls} placeholder="10" />
          </div>
        );
      case 'price_range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Min Price</label>
              <input type="number" value={cond.minValue || ''} onChange={(e) => update('minValue', parseFloat(e.target.value) || 0)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Max Price</label>
              <input type="number" value={cond.maxValue || ''} onChange={(e) => update('maxValue', parseFloat(e.target.value) || 0)} className={inputCls} placeholder="100" />
            </div>
          </div>
        );
      case 'seasonal':
      case 'scheduled':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="datetime-local" value={cond.startDate ? new Date(cond.startDate).toISOString().slice(0, 16) : ''} onChange={(e) => update('startDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="datetime-local" value={cond.endDate ? new Date(cond.endDate).toISOString().slice(0, 16) : ''} onChange={(e) => update('endDate', e.target.value)} className={inputCls} />
            </div>
          </div>
        );
      case 'specific_products':
        return (
          <div>
            <label className={labelCls}>Select Products</label>
            <select multiple value={cond.productIds?.map(p => typeof p === 'object' ? p._id : p) || []} onChange={(e) => update('productIds', Array.from(e.target.selectedOptions, (o) => o.value))} className={`${inputCls} h-28`}>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        );
      case 'specific_categories':
      case 'category_sale':
      case 'category_featured':
        return (
          <div>
            <label className={labelCls}>Select Categories</label>
            <select multiple value={cond.categoryIds?.map(c => typeof c === 'object' ? c._id : c) || []} onChange={(e) => update('categoryIds', Array.from(e.target.selectedOptions, (o) => o.value))} className={`${inputCls} h-28`}>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        );
      case 'specific_tags':
        return (
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input type="text" value={(cond.tags || []).join(', ')} onChange={(e) => update('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className={inputCls} placeholder="sale, summer, hot" />
          </div>
        );
      case 'specific_brands':
        return (
          <div>
            <label className={labelCls}>Brands (comma-separated)</label>
            <input type="text" value={(cond.brands || []).join(', ')} onChange={(e) => update('brands', e.target.value.split(',').map(b => b.trim()).filter(Boolean))} className={inputCls} placeholder="Nike, Adidas" />
          </div>
        );
      case 'member_only':
        return (
          <div>
            <label className={labelCls}>Customer Group IDs (optional)</label>
            <input type="text" value={(cond.customerGroupIds || []).join(', ')} onChange={(e) => update('customerGroupIds', e.target.value.split(',').map(id => id.trim()).filter(Boolean))} className={inputCls} placeholder="Leave empty for any logged-in user" />
          </div>
        );
      case 'custom_field':
        return (
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Field Key</label>
              <input type="text" value={cond.customFieldKey || ''} onChange={(e) => update('customFieldKey', e.target.value)} className={inputCls} placeholder="e.g. warranty" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Operator</label>
                <select value={cond.customFieldOperator || 'equals'} onChange={(e) => update('customFieldOperator', e.target.value)} className={selectCls}>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Value</label>
                <input type="text" value={cond.customFieldValue || ''} onChange={(e) => update('customFieldValue', e.target.value)} className={inputCls} placeholder="e.g. 5 years" />
              </div>
            </div>
          </div>
        );
      case 'on_sale':
      case 'out_of_stock':
      case 'featured':
      case 'free_shipping':
      case 'clearance':
      case 'bundle_deal':
      case 'pre_order':
      case 'static':
        return <p className="text-xs text-gray-400">No additional parameters needed</p>;
      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── TAB: Styling ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  function renderStylingTab() {
    const s = badge.style;
    return (
      <>
        <Section title="Badge Type">
          <div className="flex gap-2">
            {[
              { value: 'text', icon: IoText, label: 'Text' },
              { value: 'image', icon: IoImage, label: 'Image' },
              { value: 'html', icon: IoCode, label: 'HTML' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => updateStyle('badgeType', value)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                  s.badgeType === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </Section>

        {s.badgeType === 'text' && (
          <>
            <Section title="Text Content">
              <div>
                <label className={labelCls}>Badge Text</label>
                <input type="text" value={s.text} onChange={(e) => updateStyle('text', e.target.value)} className={inputCls} placeholder="Sale" />
              </div>
              <div>
                <label className={labelCls}>Quick Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_PRESETS.map((preset) => (
                    <button key={preset} onClick={() => updateStyle('text', preset)} className={`px-2 py-1 text-[10px] border rounded transition-colors ${s.text === preset ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Colors">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Text Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={s.textColor} onChange={(e) => updateStyle('textColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-300" />
                    <input type="text" value={s.textColor} onChange={(e) => updateStyle('textColor', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Background Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={s.backgroundColor} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-300" />
                    <input type="text" value={s.backgroundColor} onChange={(e) => updateStyle('backgroundColor', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Color Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => { updateStyle('backgroundColor', preset.bg); updateStyle('textColor', preset.text); updateStyle('useGradient', false); }}
                      className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors relative group"
                      style={{ backgroundColor: preset.bg }}
                      title={preset.name}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient */}
              <div className="border-t border-gray-100 pt-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
                  <input type="checkbox" checked={s.useGradient} onChange={(e) => updateStyle('useGradient', e.target.checked)} className="rounded" />
                  Use Gradient Background
                </label>
                {s.useGradient && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className={labelCls}>From</label>
                        <input type="color" value={s.gradientFrom} onChange={(e) => updateStyle('gradientFrom', e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                      </div>
                      <div>
                        <label className={labelCls}>To</label>
                        <input type="color" value={s.gradientTo} onChange={(e) => updateStyle('gradientTo', e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                      </div>
                      <div>
                        <label className={labelCls}>Direction</label>
                        <input type="text" value={s.gradientDirection} onChange={(e) => updateStyle('gradientDirection', e.target.value)} className={inputCls} placeholder="135deg" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.name}
                          onClick={() => { updateStyle('gradientFrom', g.from); updateStyle('gradientTo', g.to); updateStyle('gradientDirection', g.dir); updateStyle('useGradient', true); }}
                          className="w-12 h-6 rounded border border-gray-200 hover:border-gray-400"
                          style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }}
                          title={g.name}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Section>

            <Section title="Typography">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Font Size</label>
                  <input type="text" value={s.fontSize} onChange={(e) => updateStyle('fontSize', e.target.value)} className={inputCls} placeholder="12px" />
                </div>
                <div>
                  <label className={labelCls}>Font Weight</label>
                  <select value={s.fontWeight} onChange={(e) => updateStyle('fontWeight', e.target.value)} className={selectCls}>
                    {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Text Transform</label>
                  <select value={s.textTransform} onChange={(e) => updateStyle('textTransform', e.target.value)} className={selectCls}>
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Font Style</label>
                  <select value={s.fontStyle} onChange={(e) => updateStyle('fontStyle', e.target.value)} className={selectCls}>
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Letter Spacing</label>
                  <input type="text" value={s.letterSpacing} onChange={(e) => updateStyle('letterSpacing', e.target.value)} className={inputCls} placeholder="0.5px" />
                </div>
                <div>
                  <label className={labelCls}>Line Height</label>
                  <input type="text" value={s.lineHeight} onChange={(e) => updateStyle('lineHeight', e.target.value)} className={inputCls} placeholder="1" />
                </div>
              </div>
            </Section>

            <Section title="Shape">
              <div className="grid grid-cols-3 gap-1.5">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    onClick={() => updateStyle('shape', shape.value)}
                    className={`px-2 py-1.5 text-xs rounded-lg border-2 font-medium transition-colors ${
                      s.shape === shape.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        {s.badgeType === 'image' && (
          <Section title="Image Badge">
            <div>
              <label className={labelCls}>Image URL</label>
              <div className="flex gap-2">
                <input type="text" value={s.imageUrl} onChange={(e) => updateStyle('imageUrl', e.target.value)} className={`${inputCls} flex-1`} placeholder="https://..." />
                <button onClick={() => setMediaModalOpen(true)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                  <IoImage size={16} />
                </button>
              </div>
            </div>
            {s.imageUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img src={s.imageUrl} alt="Badge" className="w-16 h-16 object-contain rounded" />
                <button onClick={() => updateStyle('imageUrl', '')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Width</label>
                <input type="text" value={s.imageWidth} onChange={(e) => updateStyle('imageWidth', e.target.value)} className={inputCls} placeholder="60px" />
              </div>
              <div>
                <label className={labelCls}>Height</label>
                <input type="text" value={s.imageHeight} onChange={(e) => updateStyle('imageHeight', e.target.value)} className={inputCls} placeholder="auto" />
              </div>
              <div>
                <label className={labelCls}>Object Fit</label>
                <select value={s.imageObjectFit} onChange={(e) => updateStyle('imageObjectFit', e.target.value)} className={selectCls}>
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </Section>
        )}

        {s.badgeType === 'html' && (
          <Section title="HTML Badge">
            <div>
              <label className={labelCls}>Custom HTML</label>
              <textarea value={s.htmlContent} onChange={(e) => updateStyle('htmlContent', e.target.value)} className={`${inputCls} font-mono text-xs`} rows={6} placeholder='<div class="my-badge">Sale</div>' />
            </div>
          </Section>
        )}

        <Section title="Animation" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-1.5">
            {ANIMATIONS.map((anim) => (
              <button
                key={anim.value}
                onClick={() => updateStyle('animation', anim.value)}
                className={`px-2 py-1.5 text-xs rounded-lg border-2 font-medium transition-colors ${
                  s.animation === anim.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </Section>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── TAB: Advanced ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  function renderAdvancedTab() {
    const s = badge.style;
    return (
      <>
        <Section title="Position">
          <div className="grid grid-cols-3 gap-1.5">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => updateStyle('position', pos.value)}
                className={`px-2 py-2 text-xs rounded-lg border-2 font-medium transition-colors ${
                  s.position === pos.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
          {s.position === 'custom' && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['Top', 'Right', 'Bottom', 'Left'].map((dir) => (
                <div key={dir}>
                  <label className={labelCls}>{dir}</label>
                  <input type="text" value={s[`custom${dir}`] || ''} onChange={(e) => updateStyle(`custom${dir}`, e.target.value)} className={inputCls} placeholder="auto" />
                </div>
              ))}
            </div>
          )}
          <div>
            <label className={labelCls}>Z-Index</label>
            <input type="number" value={s.zIndex} onChange={(e) => updateStyle('zIndex', parseInt(e.target.value) || 10)} className={inputCls} />
          </div>
        </Section>

        <Section title="Spacing">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Margin (outer)</p>
          <div className="grid grid-cols-4 gap-2">
            {['Top', 'Right', 'Bottom', 'Left'].map((dir) => (
              <div key={dir}>
                <label className={labelCls}>{dir}</label>
                <input type="text" value={s[`margin${dir}`] || ''} onChange={(e) => updateStyle(`margin${dir}`, e.target.value)} className={inputCls} placeholder="0px" />
              </div>
            ))}
          </div>
          <p className="text-[10px] font-medium text-gray-500 uppercase mt-2">Padding (inner)</p>
          <div className="grid grid-cols-4 gap-2">
            {['Top', 'Right', 'Bottom', 'Left'].map((dir) => (
              <div key={dir}>
                <label className={labelCls}>{dir}</label>
                <input type="text" value={s[`padding${dir}`] || ''} onChange={(e) => updateStyle(`padding${dir}`, e.target.value)} className={inputCls} placeholder="4px" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Sizing" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'width', label: 'Width', ph: 'auto' },
              { key: 'height', label: 'Height', ph: 'auto' },
              { key: 'minWidth', label: 'Min Width', ph: '' },
              { key: 'maxWidth', label: 'Max Width', ph: '' },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="text" value={s[key] || ''} onChange={(e) => updateStyle(key, e.target.value)} className={inputCls} placeholder={ph} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Border Radius</label>
              <input type="text" value={s.borderRadius} onChange={(e) => updateStyle('borderRadius', e.target.value)} className={inputCls} placeholder="4px" />
            </div>
            <div>
              <label className={labelCls}>Border Width</label>
              <input type="text" value={s.borderWidth} onChange={(e) => updateStyle('borderWidth', e.target.value)} className={inputCls} placeholder="0px" />
            </div>
            <div>
              <label className={labelCls}>Border Style</label>
              <select value={s.borderStyle} onChange={(e) => updateStyle('borderStyle', e.target.value)} className={selectCls}>
                {['none','solid','dashed','dotted','double','groove','ridge','inset','outset'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Border Color</label>
              <div className="flex gap-2">
                <input type="color" value={s.borderColor === 'transparent' ? '#000000' : s.borderColor} onChange={(e) => updateStyle('borderColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <input type="text" value={s.borderColor} onChange={(e) => updateStyle('borderColor', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'borderTopLeftRadius', label: 'TL' },
              { key: 'borderTopRightRadius', label: 'TR' },
              { key: 'borderBottomRightRadius', label: 'BR' },
              { key: 'borderBottomLeftRadius', label: 'BL' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="text" value={s[key] || ''} onChange={(e) => updateStyle(key, e.target.value)} className={inputCls} placeholder="inherit" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadow" defaultOpen={false}>
          <div>
            <label className={labelCls}>Box Shadow (CSS)</label>
            <input type="text" value={s.boxShadow} onChange={(e) => updateStyle('boxShadow', e.target.value)} className={inputCls} placeholder="0 2px 8px rgba(0,0,0,0.15)" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'None', val: '' },
              { label: 'Sm', val: '0 1px 2px rgba(0,0,0,0.1)' },
              { label: 'Md', val: '0 4px 6px rgba(0,0,0,0.1)' },
              { label: 'Lg', val: '0 10px 15px rgba(0,0,0,0.1)' },
              { label: 'Xl', val: '0 20px 25px rgba(0,0,0,0.15)' },
              { label: 'Glow', val: '0 0 10px rgba(239,68,68,0.5)' },
            ].map((p) => (
              <button key={p.label} onClick={() => updateStyle('boxShadow', p.val)} className={`px-2 py-1 text-[10px] rounded border ${s.boxShadow === p.val ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Transform" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'rotate', label: 'Rotate', ph: '0deg' },
              { key: 'scale', label: 'Scale', ph: '1' },
              { key: 'translateX', label: 'Translate X', ph: '0px' },
              { key: 'translateY', label: 'Translate Y', ph: '0px' },
              { key: 'skewX', label: 'Skew X', ph: '0deg' },
              { key: 'skewY', label: 'Skew Y', ph: '0deg' },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="text" value={s[key] || ''} onChange={(e) => updateStyle(key, e.target.value)} className={inputCls} placeholder={ph} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Reset', vals: { rotate: '0deg', scale: '1', translateX: '0px', translateY: '0px' } },
              { label: '-15°', vals: { rotate: '-15deg' } },
              { label: '-30°', vals: { rotate: '-30deg' } },
              { label: '-45°', vals: { rotate: '-45deg' } },
              { label: '15°', vals: { rotate: '15deg' } },
              { label: '45°', vals: { rotate: '45deg' } },
              { label: 'Scale 1.2', vals: { scale: '1.2' } },
            ].map((p) => (
              <button key={p.label} onClick={() => Object.entries(p.vals).forEach(([k, v]) => updateStyle(k, v))} className="px-2 py-1 text-[10px] rounded border border-gray-200 hover:bg-gray-50">
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Effects" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Opacity</label>
              <input type="range" min="0" max="1" step="0.05" value={s.opacity || 1} onChange={(e) => updateStyle('opacity', e.target.value)} className="w-full" />
              <span className="text-xs text-gray-400">{s.opacity}</span>
            </div>
            <div>
              <label className={labelCls}>Mix Blend Mode</label>
              <select value={s.mixBlendMode} onChange={(e) => updateStyle('mixBlendMode', e.target.value)} className={selectCls}>
                {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>CSS Filter</label>
            <input type="text" value={s.filter || ''} onChange={(e) => updateStyle('filter', e.target.value)} className={inputCls} placeholder="blur(2px) brightness(1.1)" />
          </div>
          <div>
            <label className={labelCls}>Backdrop Filter</label>
            <input type="text" value={s.backdropFilter || ''} onChange={(e) => updateStyle('backdropFilter', e.target.value)} className={inputCls} placeholder="blur(10px)" />
          </div>
        </Section>

        <Section title="Custom CSS" defaultOpen={false}>
          <div>
            <label className={labelCls}>Additional CSS (applied as inline override)</label>
            <textarea value={s.customCSS || ''} onChange={(e) => updateStyle('customCSS', e.target.value)} className={`${inputCls} font-mono text-xs`} rows={4} placeholder=".badge { animation: myAnim 2s infinite; }" />
          </div>
        </Section>
      </>
    );
  }
};

export default BadgeEditorModal;
