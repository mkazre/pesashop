import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending_approval: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-gray-100 text-gray-400',
};

const STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  active: 'Active',
  paused: 'Paused',
  rejected: 'Rejected',
  expired: 'Expired',
};

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export default function ServiceProviderAdsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: '', page: 1, limit: 30 });
  const [selectedAd, setSelectedAd] = useState(null);

  const { data, isLoading } = useQuery(
    ['sp-ads-admin', filter],
    () => api.get('/service-provider-ads', { params: filter }).then(r => r.data),
    { keepPreviousData: true }
  );

  const ads = data?.data || [];
  // Backend returns pagination.total
  const total = data?.pagination?.total ?? data?.total ?? 0;

  const approveMutation = useMutation(
    (id) => api.put(`/service-provider-ads/${id}/approve`),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad approved and set to active'); setSelectedAd(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );
  const rejectMutation = useMutation(
    ({ id, reason }) => api.put(`/service-provider-ads/${id}/reject`, { reason }),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad rejected'); setSelectedAd(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );
  const deleteMutation = useMutation(
    (id) => api.delete(`/service-provider-ads/${id}`),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad deleted'); setSelectedAd(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );
  const pauseMutation = useMutation(
    (id) => api.put(`/service-provider-ads/${id}`, { status: 'paused' }),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad paused'); setSelectedAd(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );
  const activateMutation = useMutation(
    (id) => api.put(`/service-provider-ads/${id}`, { status: 'active' }),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad activated'); setSelectedAd(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );

  const handleReject = (id) => {
    const reason = window.prompt('Rejection reason (shown to provider):');
    if (reason === null) return;
    rejectMutation.mutate({ id, reason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Provider Ads</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage ads submitted by service providers</p>
        </div>
        <div className="text-sm text-gray-500">{total} total ads</div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(f => ({ ...f, status: tab.value, page: 1 }))}
            className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${
              filter.status === tab.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">No ads found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Impr / Clicks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map(ad => (
                  <tr key={ad._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl && (
                          <img src={ad.imageUrl} alt="" className="w-12 h-8 object-cover rounded border border-gray-100 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{ad.title}</p>
                          {ad.body && <p className="text-xs text-gray-500 truncate max-w-[200px]">{ad.body}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {ad.provider?.businessName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {ad.placementSlot ? (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{ad.placementSlot}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ad.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[ad.status] || ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {(ad.impressions || 0).toLocaleString()} / {(ad.clicks || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap items-center">
                        <button
                          onClick={() => setSelectedAd(ad)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        {ad.status === 'pending_approval' && (
                          <>
                            <button onClick={() => approveMutation.mutate(ad._id)} className="text-xs text-green-600 hover:text-green-700 font-semibold">Approve</button>
                            <button onClick={() => handleReject(ad._id)} className="text-xs text-red-500 hover:text-red-600">Reject</button>
                          </>
                        )}
                        {ad.status === 'active' && (
                          <button onClick={() => pauseMutation.mutate(ad._id)} className="text-xs text-amber-600 hover:text-amber-700">Pause</button>
                        )}
                        {ad.status === 'paused' && (
                          <button onClick={() => activateMutation.mutate(ad._id)} className="text-xs text-green-600 hover:text-green-700">Activate</button>
                        )}
                        <button
                          onClick={() => { if (window.confirm('Permanently delete this ad?')) deleteMutation.mutate(ad._id); }}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > filter.limit && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">Showing {ads.length} of {total}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                  disabled={filter.page === 1}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                  disabled={ads.length < filter.limit}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ad Detail Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Ad Detail</h2>
              <button onClick={() => setSelectedAd(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image preview */}
              {selectedAd.imageUrl && (
                <img src={selectedAd.imageUrl} alt={selectedAd.title} className="w-full h-48 object-cover rounded-lg border border-gray-100" />
              )}

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[selectedAd.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[selectedAd.status] || selectedAd.status}
                </span>
                {selectedAd.rejectionReason && (
                  <span className="text-xs text-red-600">Reason: {selectedAd.rejectionReason}</span>
                )}
              </div>

              {/* Ad content */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Title</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAd.title}</p>
                </div>
                {selectedAd.body && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Body</p>
                    <p className="text-sm text-gray-700">{selectedAd.body}</p>
                  </div>
                )}
                {selectedAd.ctaText && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">CTA Button</p>
                    <p className="text-sm text-gray-700">{selectedAd.ctaText}</p>
                    {selectedAd.ctaUrl && (
                      <a href={selectedAd.ctaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all">{selectedAd.ctaUrl}</a>
                    )}
                  </div>
                )}
              </div>

              {/* Placement & dates */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-medium text-gray-900">{selectedAd.provider?.businessName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Placement Slot:</span>
                  <span className="font-medium text-gray-900">{selectedAd.placementSlot || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted:</span>
                  <span className="text-gray-700">{new Date(selectedAd.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {selectedAd.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active from:</span>
                    <span className="text-gray-700">{new Date(selectedAd.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedAd.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires:</span>
                    <span className="text-gray-700">{new Date(selectedAd.endDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Impressions / Clicks:</span>
                  <span className="text-gray-700">{(selectedAd.impressions || 0).toLocaleString()} / {(selectedAd.clicks || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* AI keywords */}
              {(selectedAd.aiKeywords || []).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Targeting Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAd.aiKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                {selectedAd.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(selectedAd._id)}
                      disabled={approveMutation.isLoading}
                      className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedAd._id)}
                      disabled={rejectMutation.isLoading}
                      className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedAd.status === 'active' && (
                  <button
                    onClick={() => pauseMutation.mutate(selectedAd._id)}
                    disabled={pauseMutation.isLoading}
                    className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded hover:bg-amber-600 disabled:opacity-60"
                  >
                    Pause Ad
                  </button>
                )}
                {selectedAd.status === 'paused' && (
                  <button
                    onClick={() => activateMutation.mutate(selectedAd._id)}
                    disabled={activateMutation.isLoading}
                    className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:opacity-60"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => { if (window.confirm('Permanently delete this ad?')) deleteMutation.mutate(selectedAd._id); }}
                  className="px-4 py-2 border border-red-200 text-red-500 text-sm font-semibold rounded hover:bg-red-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
