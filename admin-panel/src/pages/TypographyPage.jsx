import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsAPI } from '../services/api';
import toast from '@/utils/toast';
import { getFontsByCategory, toCssFontFamily, resolveTypography, buildGoogleFontsUrl } from '@/constants/fontRegistry';
import { IoSaveOutline, IoTextOutline } from 'react-icons/io5';

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS = { 'sans-serif': 'Sans-serif', serif: 'Serif', display: 'Display', monospace: 'Monospace' };

const PAGE_ORDER = ['home', 'shop', 'product', 'account', 'custom'];
const PAGE_LABELS = { home: 'Home', shop: 'Shop', product: 'Single Product', account: 'My Account', custom: 'Custom Pages' };

const DEFAULT_TYPOGRAPHY = {
  global: { body: 'Inter', heading: '' },
  pages: {
    home: { body: '', heading: '' },
    shop: { body: '', heading: '' },
    product: { body: '', heading: '' },
    account: { body: '', heading: '' },
    custom: { body: '', heading: '' },
  },
};

// Loaded Google Fonts, deduped across renders (and remounts within this tab) —
// mirrors the approach the storefront uses so the preview boxes below
// actually render in the chosen typeface.
const injectedAdminFonts = new Set();

function useFontPreviewLoader(fontNames) {
  const key = fontNames.join('|');
  useEffect(() => {
    const toLoad = fontNames.filter((n) => n && !injectedAdminFonts.has(n));
    if (toLoad.length === 0) return;
    const href = buildGoogleFontsUrl(toLoad);
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    toLoad.forEach((n) => injectedAdminFonts.add(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function FontSelect({ label, value, onChange, inheritLabel }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 text-sm focus:border-green-500 focus:outline-none"
      >
        {inheritLabel && <option value="">{inheritLabel}</option>}
        {getFontsByCategory().map(({ category, items }) => (
          <optgroup key={category} label={CATEGORY_LABELS[category] || category}>
            {items.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function FontPreview({ body, heading }) {
  return (
    <div className="mt-3 p-4 border border-gray-200 bg-gray-50">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Preview — {heading}{heading !== body ? ` / ${body}` : ''}</p>
      <h3 style={{ fontFamily: toCssFontFamily(heading) }} className="text-2xl font-bold text-gray-900 mb-1">
        The quick brown fox jumps
      </h3>
      <p style={{ fontFamily: toCssFontFamily(body) }} className="text-sm text-gray-600">
        Over the lazy dog. 0123456789 — a short paragraph to preview body text at a normal reading size.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TypographyPage() {
  const queryClient = useQueryClient();
  const [typography, setTypography] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { isLoading, error } = useQuery('settings', () => settingsAPI.getAll(), {
    onSuccess: (res) => {
      if (!typography) {
        const data = res.data?.data || res.data || {};
        setTypography(data.typography || DEFAULT_TYPOGRAPHY);
      }
    },
  });

  const saveMutation = useMutation((data) => settingsAPI.update({ typography: data }), {
    onSuccess: () => {
      queryClient.invalidateQueries('settings');
      setDirty(false);
      toast.success('Typography saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const t = typography || DEFAULT_TYPOGRAPHY;

  const updateGlobal = (key, value) => {
    setTypography((prev) => {
      const base = prev || DEFAULT_TYPOGRAPHY;
      return { ...base, global: { ...base.global, [key]: value } };
    });
    setDirty(true);
  };

  const updatePage = (page, key, value) => {
    setTypography((prev) => {
      const base = prev || DEFAULT_TYPOGRAPHY;
      return { ...base, pages: { ...base.pages, [page]: { ...base.pages?.[page], [key]: value } } };
    });
    setDirty(true);
  };

  // Every font referenced anywhere in the current draft (global + all page
  // overrides), so every preview box below renders in its real typeface.
  const allFontNames = useMemo(() => {
    const names = [t.global?.body, t.global?.heading];
    PAGE_ORDER.forEach((p) => names.push(t.pages?.[p]?.body, t.pages?.[p]?.heading));
    return [...new Set(names.filter(Boolean))];
  }, [t]);
  useFontPreviewLoader(allFontNames);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load settings</div>;

  const globalResolved = resolveTypography(t, null);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><IoTextOutline /> Typography</h1>
          <p className="text-sm text-gray-500 mt-1">Set fonts for the whole storefront, and override them per page</p>
        </div>
        <button
          onClick={() => saveMutation.mutate(t)}
          disabled={!dirty || saveMutation.isLoading}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-medium text-white transition-colors ${dirty ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          <IoSaveOutline size={16} /> {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* ─── GLOBAL ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 mb-3 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Global</h3>
        <p className="text-xs text-gray-500 mb-4">Applies site-wide unless a page below overrides it</p>
        <div className="grid grid-cols-2 gap-4">
          <FontSelect label="Body Font" value={t.global?.body} onChange={(v) => updateGlobal('body', v)} />
          <FontSelect label="Heading Font" value={t.global?.heading} onChange={(v) => updateGlobal('heading', v)} inheritLabel="Same as Body" />
        </div>
        <FontPreview body={globalResolved.body} heading={globalResolved.heading} />
      </div>

      {/* ─── PER-PAGE OVERRIDES ─────────────────────────────────────────── */}
      {PAGE_ORDER.map((page) => {
        const resolved = resolveTypography(t, page);
        return (
          <div key={page} className="bg-white border border-gray-200 mb-3 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{PAGE_LABELS[page]}</h3>
            <p className="text-xs text-gray-500 mb-4">Leave on "Use Global" to inherit the global fonts above</p>
            <div className="grid grid-cols-2 gap-4">
              <FontSelect
                label="Body Font"
                value={t.pages?.[page]?.body}
                onChange={(v) => updatePage(page, 'body', v)}
                inheritLabel={`Use Global (${globalResolved.body})`}
              />
              <FontSelect
                label="Heading Font"
                value={t.pages?.[page]?.heading}
                onChange={(v) => updatePage(page, 'heading', v)}
                inheritLabel="Same as Body"
              />
            </div>
            <FontPreview body={resolved.body} heading={resolved.heading} />
          </div>
        );
      })}
    </div>
  );
}
