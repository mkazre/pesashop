import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  pushed_forward: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  pending: 'Pending Review',
  pushed_forward: 'Pushed Forward',
  rejected: 'Rejected',
};

export default function ServiceProviderAdEnquiriesTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [notesInput, setNotesInput] = useState('');

  const { data, isLoading } = useQuery(
    ['sp-ad-enquiries', statusFilter],
    () => api.get('/service-provider-ads/enquiries', { params: { status: statusFilter, limit: 50 } }).then(r => r.data),
    { keepPreviousData: true }
  );

  const enquiries = data?.data || [];
  const total = data?.pagination?.total ?? 0;

  const pushMutation = useMutation(
    ({ id, notes }) => api.put(`/service-provider-ads/enquiries/${id}/push-forward`, { notes }),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ad-enquiries'); toast.success('Enquiry pushed forward — provider notified'); setSelected(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );

  const rejectMutation = useMutation(
    ({ id, notes }) => api.put(`/service-provider-ads/enquiries/${id}/reject`, { notes }),
    {
      onSuccess: () => { qc.invalidateQueries('sp-ad-enquiries'); toast.success('Enquiry rejected'); setSelected(null); },
      onError: e => toast.error(e.response?.data?.message || 'Error')
    }
  );

  return (
    <div className="space-y-5">
      {/* Stats + filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'pushed_forward', l: 'Pushed Forward' }, { v: 'rejected', l: 'Rejected' }].map(f => (
            <button
              key={f.v}
              onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${statusFilter === f.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
            >
              {f.l}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{total} enquiries</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📬</div>
          <p className="font-medium">No enquiries yet</p>
          <p className="text-sm mt-1">Customer enquiries from ad cards will appear here</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Ad</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.map(eq => (
                <tr key={eq._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{eq.name}</p>
                    <p className="text-xs text-gray-400">{eq.phone}</p>
                    <p className="text-xs text-gray-400">{eq.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 font-medium line-clamp-1">{eq.ad?.title || '—'}</p>
                    <p className="text-xs text-gray-400">{eq.ad?.placementSlot || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{eq.provider?.businessName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(eq.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[eq.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[eq.status] || eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(eq); setNotesInput(''); }} className="text-blue-600 hover:underline text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Ad banner */}
            {selected.ad?.imageUrl && (
              <img src={selected.ad.imageUrl} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Enquiry Details</h3>
                  <p className="text-sm text-gray-500">Ad: <span className="font-medium text-gray-700">{selected.ad?.title}</span></p>
                  <p className="text-sm text-gray-500">Provider: <span className="font-medium text-gray-700">{selected.provider?.businessName}</span></p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[selected.status] || 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[selected.status] || selected.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <Row label="Name" value={selected.name} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Email" value={selected.email} />
                <Row label="Location" value={selected.location || 'Not provided'} />
                <Row label="Preferred Date" value={selected.preferredDate ? new Date(selected.preferredDate).toLocaleDateString() : 'Not specified'} />
                <Row label="Submitted" value={new Date(selected.createdAt).toLocaleString()} />
                {selected.additionalInfo && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Additional Info</p>
                    <p className="text-gray-700">{selected.additionalInfo}</p>
                  </div>
                )}
                {selected.adminNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                    <p className="text-gray-700">{selected.adminNotes}</p>
                  </div>
                )}
              </div>

              {selected.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Admin Notes (optional — included in provider email)</label>
                    <textarea
                      value={notesInput}
                      onChange={e => setNotesInput(e.target.value)}
                      rows={2}
                      placeholder="Add context for the provider…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => pushMutation.mutate({ id: selected._id, notes: notesInput })}
                      disabled={pushMutation.isLoading}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {pushMutation.isLoading ? 'Sending…' : '✓ Push Forward to Provider'}
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate({ id: selected._id, notes: notesInput })}
                      disabled={rejectMutation.isLoading}
                      className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setSelected(null)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
