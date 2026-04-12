import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-gray-100 text-gray-400',
};

export default function ServiceProviderAdsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: '', page: 1, limit: 30 });

  const { data, isLoading } = useQuery(
    ['sp-ads-admin', filter],
    () => api.get('/service-provider-ads', { params: filter }).then(r => r.data),
    { keepPreviousData: true }
  );

  const ads = data?.data || [];
  const total = data?.total || 0;

  const approveMutation = useMutation(
    (id) => api.put(`/service-provider-ads/${id}/approve`),
    { onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad approved'); }, onError: e => toast.error(e.response?.data?.message || 'Error') }
  );
  const rejectMutation = useMutation(
    ({ id, reason }) => api.put(`/service-provider-ads/${id}/reject`, { reason }),
    { onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad rejected'); }, onError: e => toast.error(e.response?.data?.message || 'Error') }
  );
  const deleteMutation = useMutation(
    (id) => api.delete(`/service-provider-ads/${id}`),
    { onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad deleted'); }, onError: e => toast.error(e.response?.data?.message || 'Error') }
  );
  const pauseMutation = useMutation(
    (id) => api.put(`/service-provider-ads/${id}`, { status: 'paused' }),
    { onSuccess: () => { qc.invalidateQueries('sp-ads-admin'); toast.success('Ad paused'); }, onError: e => toast.error(e.response?.data?.message || 'Error') }
  );

  const handleReject = (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    rejectMutation.mutate({ id, reason });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Provider Ads</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage ads submitted by service providers</p>
        </div>
        <div className="text-sm text-gray-500">{total} total ads</div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['', 'pending', 'active', 'paused', 'rejected', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, status: s, page: 1 }))}
            className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${filter.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Slot</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Impressions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Clicks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Expires</th>
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
                        {ad.ctaUrl && (
                          <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block max-w-[200px]">
                            {ad.ctaText || ad.ctaUrl}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{ad.provider?.businessName || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(ad.placementSlots || []).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ad.status] || 'bg-gray-100 text-gray-600'}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{(ad.impressions || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{(ad.clicks || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {ad.status === 'pending' && (
                        <>
                          <button onClick={() => approveMutation.mutate(ad._id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Approve</button>
                          <button onClick={() => handleReject(ad._id)} className="text-xs text-red-500 hover:text-red-600">Reject</button>
                        </>
                      )}
                      {ad.status === 'active' && (
                        <button onClick={() => pauseMutation.mutate(ad._id)} className="text-xs text-amber-600 hover:text-amber-700">Pause</button>
                      )}
                      {ad.status === 'paused' && (
                        <button onClick={() => approveMutation.mutate(ad._id)} className="text-xs text-green-600 hover:text-green-700">Activate</button>
                      )}
                      <button
                        onClick={() => { if (window.confirm('Delete this ad?')) deleteMutation.mutate(ad._id); }}
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
    </div>
  );
}
