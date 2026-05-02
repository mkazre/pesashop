import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI, b2bkingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { IoSearch, IoFlash, IoWarning, IoRefresh, IoCheckmarkCircle } from 'react-icons/io5';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 50;

/**
 * Price Fix Tool — repairs prices that were truncated during CSV import
 * (e.g. "1.000,00" parsed by parseFloat as 1.0). The user filters to a
 * suspicious price range, multi-selects affected products, picks a multiplier
 * (×10 / ×100 / ×1000 / custom) and which fields to scale, previews the
 * before/after, and applies. Optionally re-runs pricing rules afterwards
 * so regularPrice is recomputed from the corrected backendPrice.
 */
export default function PriceFixToolPage() {
  const queryClient = useQueryClient();

  // ─── Filters ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [maxBackendPrice, setMaxBackendPrice] = useState('5');     // suspicious threshold
  const [page, setPage] = useState(1);

  // Build params for the products list
  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, sort: 'price-asc' };
    if (search.trim()) p.search = search.trim();
    return p;
  }, [page, search]);

  const { data, isLoading, refetch } = useQuery(
    ['priceFixProducts', params],
    () => productsAPI.getAll(params),
    { keepPreviousData: true }
  );

  // ─── Local filter (max backend price) ────────────────────────
  const allProducts = data?.data?.data || [];
  const max = parseFloat(maxBackendPrice);
  const filtered = useMemo(() => {
    if (!Number.isFinite(max) || max <= 0) return allProducts;
    return allProducts.filter((p) => (p.backendPrice ?? 0) <= max);
  }, [allProducts, max]);

  // ─── Selection ───────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  useEffect(() => { setSelectedIds(new Set()); /* clear when filter changes */ }, [params, max]);
  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const allSelectedOnPage = filtered.length > 0 && filtered.every((p) => selectedIds.has(p._id));
  const toggleAllOnPage = () => {
    const next = new Set(selectedIds);
    if (allSelectedOnPage) {
      filtered.forEach((p) => next.delete(p._id));
    } else {
      filtered.forEach((p) => next.add(p._id));
    }
    setSelectedIds(next);
  };

  // ─── Fix config ──────────────────────────────────────────────
  const [multiplier, setMultiplier] = useState(100);
  const [customMultiplier, setCustomMultiplier] = useState('');
  const [fields, setFields] = useState({ backendPrice: true, regularPrice: false, salePrice: false });
  const [reapplyRules, setReapplyRules] = useState(true);

  const effectiveMultiplier = customMultiplier && parseFloat(customMultiplier) > 0
    ? parseFloat(customMultiplier)
    : multiplier;
  const targetFields = Object.keys(fields).filter((k) => fields[k]);

  // ─── Apply ───────────────────────────────────────────────────
  const scaleMutation = useMutation(
    (payload) => productsAPI.scalePrices(payload),
    {
      onSuccess: async (res) => {
        const matched = res.data?.data?.matched ?? 0;
        const modified = res.data?.data?.modified ?? 0;
        toast.success(`Scaled prices for ${modified} of ${matched} product(s)`);
        setSelectedIds(new Set());
        queryClient.invalidateQueries('priceFixProducts');

        // Optionally re-run pricing rules so regularPrice gets recomputed
        if (reapplyRules) {
          try {
            await b2bkingAPI.recalculatePrices({});
            toast.success('Recalculation started — open the Pricing Rules page to monitor progress', { duration: 6000 });
          } catch {
            toast('Could not auto-trigger recalculation. Run "Apply All Rules" manually from Pricing Rules.', { icon: '⚠️' });
          }
        }
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Failed to scale prices');
      },
    }
  );

  const handleApply = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one product');
      return;
    }
    if (targetFields.length === 0) {
      toast.error('Pick at least one field to scale');
      return;
    }
    if (!Number.isFinite(effectiveMultiplier) || effectiveMultiplier <= 0) {
      toast.error('Invalid multiplier');
      return;
    }
    const fieldList = targetFields.join(', ');
    if (!confirm(`Multiply ${fieldList} by ×${effectiveMultiplier} on ${selectedIds.size} product(s)?\n\nThis bypasses model validators (intentional, for repair). Make sure your selection is correct.`)) {
      return;
    }
    scaleMutation.mutate({
      productIds: [...selectedIds],
      multiplier: effectiveMultiplier,
      fields: targetFields,
    });
  };

  const totalCount = data?.data?.pagination?.total || allProducts.length;
  const totalPages = data?.data?.pagination?.totalPages || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <IoFlash size={26} className="text-amber-600" />
          Price Fix Tool
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Repair products whose prices were truncated by a CSV import — typically caused by comma-decimal
          formats like <code className="bg-gray-100 px-1 rounded">1.000,00</code> being parsed as
          <code className="bg-gray-100 px-1 rounded">1.0</code>. Filter, select, multiply, and re-run pricing rules.
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
          <IoWarning size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Heads up:</strong> this multiplies prices in place using <code>$mul</code> and bypasses
            mongoose validators (so a one-off salePrice {`>`} regularPrice during the fix won't block).
            Double-check your selection before applying. There is no automatic undo.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Search (name / SKU)</label>
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="e.g. Samsung, ABC-123"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Show only products with backendPrice ≤
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={maxBackendPrice}
            onChange={(e) => setMaxBackendPrice(e.target.value)}
            placeholder="5.00"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-gray-400 mt-1">Leave blank to see all matching products</p>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1.5"
          >
            <IoRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Fix bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-4 flex-wrap sticky top-2 z-10 shadow-sm">
          <div className="text-sm font-semibold text-blue-900">
            {selectedIds.size} selected
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">Multiply by</span>
            <select
              value={multiplier}
              onChange={(e) => { setMultiplier(parseInt(e.target.value)); setCustomMultiplier(''); }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>×10</option>
              <option value={100}>×100</option>
              <option value={1000}>×1000</option>
              <option value={0}>Custom…</option>
            </select>
            {multiplier === 0 && (
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={customMultiplier}
                onChange={(e) => setCustomMultiplier(e.target.value)}
                placeholder="e.g. 50"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">Fields:</span>
            {['backendPrice', 'regularPrice', 'salePrice'].map((f) => (
              <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields[f]}
                  onChange={(e) => setFields({ ...fields, [f]: e.target.checked })}
                />
                {f}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={reapplyRules}
              onChange={(e) => setReapplyRules(e.target.checked)}
            />
            <span className="text-gray-700">Re-run all pricing rules afterwards</span>
          </label>
          <button
            onClick={handleApply}
            disabled={scaleMutation.isLoading || targetFields.length === 0}
            className="ml-auto px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {scaleMutation.isLoading ? 'Applying…' : `Apply ×${effectiveMultiplier} →`}
          </button>
        </div>
      )}

      {/* Product list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">
            {isLoading ? 'Loading…' : `${filtered.length} of ${totalCount} products shown (page ${page} of ${totalPages})`}
          </div>
          {filtered.length > 0 && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={allSelectedOnPage} onChange={toggleAllOnPage} />
              Select all on page
            </label>
          )}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No products match the current filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left w-10"></th>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-right">backendPrice</th>
                <th className="px-3 py-2 text-right">regularPrice</th>
                <th className="px-3 py-2 text-right">salePrice</th>
                <th className="px-3 py-2 text-right">Preview new</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const checked = selectedIds.has(p._id);
                const previewBP = checked && fields.backendPrice ? (p.backendPrice || 0) * effectiveMultiplier : null;
                const previewRP = checked && fields.regularPrice ? (p.regularPrice || 0) * effectiveMultiplier : null;
                const previewSP = checked && fields.salePrice ? (p.salePrice || 0) * effectiveMultiplier : null;
                const img = p.featuredImage || p.images?.[0] || '';
                const imgUrl = img && (img.startsWith('http') ? img : `${API_BASE}${img}`);
                return (
                  <tr key={p._id} className={checked ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(p._id)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-8 h-8 object-contain bg-gray-50 border border-gray-200 rounded" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">{p.name}</div>
                          {p.categories?.[0]?.name && (
                            <div className="text-[11px] text-gray-400">{p.categories[0].name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{p.sku}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(p.backendPrice ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(p.regularPrice ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                      {p.salePrice != null ? p.salePrice.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      {!checked ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="text-gray-900 font-mono">
                          {previewBP != null && <div>BP → {previewBP.toFixed(2)}</div>}
                          {previewRP != null && <div>RP → {previewRP.toFixed(2)}</div>}
                          {previewSP != null && <div>SP → {previewSP.toFixed(2)}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 flex items-start gap-2">
        <IoCheckmarkCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <strong>Going forward:</strong> the import parser now handles comma-decimal numbers, currency symbols,
          space-thousands separators, and accounting parentheses correctly — so new CSV imports won't have
          this issue. This tool is only needed to repair products imported before that fix.
        </div>
      </div>
    </div>
  );
}
