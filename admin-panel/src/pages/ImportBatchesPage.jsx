import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  running:     'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  failed:      'bg-red-100 text-red-700',
  rolled_back: 'bg-gray-100 text-gray-600',
};

const MODE_LABELS = {
  add:     'Add new',
  update:  'Update existing',
  replace: 'Replace all',
};

const TYPE_LABELS = {
  products:   '📦 Products',
  categories: '🗂 Categories',
  customers:  '👥 Customers',
  orders:     '🛒 Orders',
};

function fmt(n) { return (n || 0).toLocaleString(); }

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

function duration(start, end) {
  if (!start || !end) return null;
  const secs = Math.round((new Date(end) - new Date(start)) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

export default function ImportBatchesPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showReconstruct, setShowReconstruct] = useState(false);
  const [gapMinutes, setGapMinutes] = useState(30);
  const [reconstructResult, setReconstructResult] = useState(null);

  const { data, isLoading, refetch } = useQuery(
    ['import-batches', typeFilter, statusFilter],
    () => api.get('/import-batches', { params: { type: typeFilter || undefined, status: statusFilter || undefined } }).then(r => r.data),
    { refetchInterval: (d) => d?.data?.some(b => b.status === 'running') ? 5000 : false }
  );

  const batches = data?.data || [];
  const total = data?.total || 0;

  const rollbackMutation = useMutation(
    (id) => api.delete(`/import-batches/${id}/rollback`),
    {
      onSuccess: (res) => {
        qc.invalidateQueries('import-batches');
        toast.success(res.data.message || 'Rolled back successfully');
        setConfirmAction(null);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Rollback failed'),
    }
  );

  const draftMutation = useMutation(
    (id) => api.put(`/import-batches/${id}/draft`),
    {
      onSuccess: (res) => { qc.invalidateQueries('import-batches'); toast.success(res.data.message); setConfirmAction(null); },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  const publishMutation = useMutation(
    (id) => api.put(`/import-batches/${id}/publish`),
    {
      onSuccess: (res) => { qc.invalidateQueries('import-batches'); toast.success(res.data.message); setConfirmAction(null); },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/import-batches/${id}`),
    {
      onSuccess: () => { qc.invalidateQueries('import-batches'); toast.success('Batch record deleted'); setConfirmAction(null); },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    if (action === 'rollback') rollbackMutation.mutate(id);
    else if (action === 'draft') draftMutation.mutate(id);
    else if (action === 'publish') publishMutation.mutate(id);
    else if (action === 'delete') deleteMutation.mutate(id);
  };

  const isWorking = rollbackMutation.isLoading || draftMutation.isLoading || publishMutation.isLoading || deleteMutation.isLoading;

  const reconstructMutation = useMutation(
    (gap) => api.post('/import-batches/reconstruct', { gapMinutes: gap }),
    {
      onSuccess: (res) => {
        qc.invalidateQueries('import-batches');
        setReconstructResult(res.data);
        setShowReconstruct(false);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Reconstruction failed'),
    }
  );

  const ACTION_LABELS = {
    rollback: { label: 'Roll Back (Delete Products)', color: 'bg-red-600', desc: 'This will permanently DELETE all products created in this batch. This cannot be undone.' },
    draft:    { label: 'Set to Draft', color: 'bg-yellow-600', desc: 'All products from this batch will be set to DRAFT (hidden from your store).' },
    publish:  { label: 'Restore to Published', color: 'bg-green-600', desc: 'All products from this batch will be set back to PUBLISHED (visible in your store).' },
    delete:   { label: 'Delete Record Only', color: 'bg-gray-600', desc: 'This deletes the batch tracking record only. Products are NOT affected.' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Batches</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} batch{total !== 1 ? 'es' : ''} tracked — roll back, draft, restore or delete by batch
          </p>
          {batches.length > 0 && (() => {
            const earliest = batches[batches.length - 1];
            return (
              <p className="text-xs text-gray-400 mt-0.5">
                First import: {formatDate(earliest.startedAt)}
              </p>
            );
          })()}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Types</option>
            <option value="products">Products</option>
            <option value="categories">Categories</option>
            <option value="customers">Customers</option>
            <option value="orders">Orders</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
          <button onClick={() => refetch()} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Reconstruct result banner */}
      {reconstructResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800">✅ {reconstructResult.message}</p>
            <p className="text-xs text-green-600 mt-0.5">Scroll down to see all reconstructed batches — you can now roll back, draft or restore any of them.</p>
          </div>
          <button onClick={() => setReconstructResult(null)} className="text-green-400 hover:text-green-600 text-lg ml-4">×</button>
        </div>
      )}

      {/* Reconstruct Panel */}
      {showReconstruct && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 text-sm mb-1">Reconstruct Past Import Batches</h3>
          <p className="text-xs text-blue-700 mb-4">
            Scans all products in your database and groups them into import sessions based on when they were created.
            Products already tracked in an existing batch are skipped. Any products created within the session gap of each
            other are treated as part of the same import session.
          </p>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-blue-800 mb-1">Session gap (minutes)</label>
              <p className="text-xs text-blue-600 mb-2">If two products were created more than this many minutes apart, they're treated as separate import sessions.</p>
              <div className="flex gap-2">
                {[15, 30, 60, 120].map(g => (
                  <button
                    key={g}
                    onClick={() => setGapMinutes(g)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      gapMinutes === g
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {g < 60 ? `${g}m` : `${g / 60}h`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => reconstructMutation.mutate(gapMinutes)}
                disabled={reconstructMutation.isLoading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {reconstructMutation.isLoading ? '⏳ Scanning...' : '🔍 Scan & Reconstruct'}
              </button>
              <button
                onClick={() => setShowReconstruct(false)}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {ACTION_LABELS[confirmAction.action]?.label}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {ACTION_LABELS[confirmAction.action]?.desc}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={isWorking}
                className={`flex-1 py-2.5 text-white rounded-lg font-semibold text-sm disabled:opacity-60 ${ACTION_LABELS[confirmAction.action]?.color}`}
              >
                {isWorking ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isWorking}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 font-medium">No import batches yet</p>
          <p className="text-sm text-gray-400 mt-1">Future imports will appear here and can be managed batch by batch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(batch => {
            const isExpanded = expanded === batch._id;
            const canAct = batch.status === 'completed' && batch.type === 'products' && batch.createdProductIds?.length > 0;
            const dur = duration(batch.startedAt, batch.completedAt);

            return (
              <div key={batch._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Main row */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : batch._id)}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left: type + date + file */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {batch.type === 'products' ? '📦' : batch.type === 'categories' ? '🗂' : batch.type === 'customers' ? '👥' : '🛒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{TYPE_LABELS[batch.type] || batch.type}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-600'}`}>
                            {batch.status === 'running' ? '⏳ Running...' : batch.status === 'completed' ? 'Completed' : batch.status === 'failed' ? 'Failed' : 'Rolled Back'}
                          </span>
                          {batch.importMode && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                              {MODE_LABELS[batch.importMode] || batch.importMode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(batch.startedAt)}{dur ? ` · ${dur}` : ''}</p>
                        {batch.originalFilename && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">📄 {batch.originalFilename}</p>
                        )}
                        {batch.categories?.length > 0 && (
                          <p className="text-xs text-blue-600 mt-0.5">📁 {batch.categories.slice(0, 4).join(', ')}{batch.categories.length > 4 ? ` +${batch.categories.length - 4} more` : ''}</p>
                        )}
                        {batch.importedBy && (
                          <p className="text-xs text-gray-400 mt-0.5">👤 {batch.importedBy.firstName} {batch.importedBy.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: result counts */}
                    <div className="flex gap-4 text-center flex-shrink-0">
                      {[
                        { label: 'Created', value: batch.results?.created, color: 'text-green-600' },
                        { label: 'Updated', value: batch.results?.updated, color: 'text-blue-600' },
                        { label: 'Skipped', value: batch.results?.skipped, color: 'text-gray-500' },
                        { label: 'Errors',  value: batch.results?.errors,  color: 'text-red-500' },
                      ].map(s => (
                        <div key={s.label}>
                          <p className={`text-lg font-bold ${s.color}`}>{fmt(s.value)}</p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                      <div className="self-center pl-2">
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    {batch.errorMessage && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                        <strong>Error:</strong> {batch.errorMessage}
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-gray-500">
                        {canAct
                          ? `${fmt(batch.createdProductIds?.length)} product IDs tracked — rollback available`
                          : batch.status === 'rolled_back'
                            ? 'This batch has been rolled back'
                            : batch.type !== 'products'
                              ? 'Batch actions only available for product imports'
                              : 'No product IDs tracked (this batch may have been updates only)'}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {canAct && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ id: batch._id, action: 'rollback' })}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                            >
                              🗑 Roll Back (Delete)
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: batch._id, action: 'draft' })}
                              className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-xs font-semibold hover:bg-yellow-600 transition-colors"
                            >
                              📝 Set to Draft
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: batch._id, action: 'publish' })}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                            >
                              ✅ Restore to Published
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setConfirmAction({ id: batch._id, action: 'delete' })}
                          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Remove Record
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
