import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  new:       'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  assigned:  'bg-purple-100 text-purple-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  new:       'New',
  in_review: 'In Review',
  assigned:  'Assigned',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default function ServiceRequestsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [assignedProvider, setAssignedProvider] = useState('');

  const { data, isLoading } = useQuery(
    ['admin-service-requests', statusFilter],
    () => api.get('/service-requests', { params: { status: statusFilter || undefined, limit: 50 } }).then(r => r.data)
  );

  const requests = data?.data || [];

  const { data: providersData } = useQuery('sp-list-active', () =>
    api.get('/service-providers', { params: { status: 'approved', limit: 100 } }).then(r => r.data.data || [])
  );
  const providers = providersData || [];

  const updateMutation = useMutation(
    ({ id, payload }) => api.put(`/service-requests/${id}`, payload),
    {
      onSuccess: (res) => {
        qc.invalidateQueries('admin-service-requests');
        setSelected(res.data.data);
        toast.success('Updated');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Error'),
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/service-requests/${id}`),
    {
      onSuccess: () => { qc.invalidateQueries('admin-service-requests'); setSelected(null); toast.success('Deleted'); },
    }
  );

  const openRequest = (r) => {
    setSelected(r);
    setNewStatus(r.status);
    setAdminNotes(r.adminNotes || '');
    setScheduledDate(r.scheduledDate ? r.scheduledDate.substring(0, 10) : '');
    setAssignedProvider(r.assignedProvider?._id || r.assignedProvider || '');
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: selected._id,
      payload: {
        status: newStatus,
        adminNotes,
        scheduledDate: scheduledDate || null,
        assignedProvider: assignedProvider || null,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Incoming requests from customers for professional services</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className={`flex-1 space-y-3 ${selected ? 'max-w-[55%]' : ''}`}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-2xl mb-2">🔧</p>
              <p className="text-gray-500">No service requests found.</p>
            </div>
          ) : (
            requests.map(r => (
              <div
                key={r._id}
                onClick={() => openRequest(r)}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-blue-300 transition-colors ${selected?._id === r._id ? 'border-blue-400 shadow-sm' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                      {r.serviceType?.icon || '🔧'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{r.serviceType?.title || 'Unknown Service'}</p>
                      <p className="text-xs text-gray-500 truncate">{r.firstName} {r.lastName} · {r.email}</p>
                      {r.city && <p className="text-xs text-gray-400">{[r.suburb, r.city, r.province].filter(Boolean).join(', ')}</p>}
                      <div className="flex gap-1 mt-1">
                        {(r.serviceModes || []).map(m => (
                          <span key={m} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-ZA')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Request Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            {/* Customer info */}
            <div className="mb-4 space-y-1">
              <p className="text-sm font-medium text-gray-900">{selected.firstName} {selected.lastName}</p>
              <p className="text-xs text-gray-500">{selected.email}</p>
              {selected.phone && <p className="text-xs text-gray-500">{selected.phone}</p>}
              {(selected.address || selected.city) && (
                <p className="text-xs text-gray-500">{[selected.address, selected.suburb, selected.city, selected.province].filter(Boolean).join(', ')}</p>
              )}
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">Service</p>
              <p className="text-sm text-gray-900">{selected.serviceType?.title || 'Unknown'}</p>
              <div className="flex gap-1 mt-1">
                {(selected.serviceModes || []).map(m => (
                  <span key={m} className="px-1.5 py-0.5 bg-white text-blue-700 rounded text-xs capitalize border border-blue-200">{m}</span>
                ))}
              </div>
              {selected.productName && <p className="text-xs text-gray-500 mt-1">Product: {selected.productName}</p>}
              {selected.description && <p className="text-xs text-gray-600 mt-1 italic">"{selected.description}"</p>}
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Assign Provider */}
            {providers.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Provider</label>
                <select
                  value={assignedProvider}
                  onChange={e => setAssignedProvider(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Unassigned —</option>
                  {providers.map(p => (
                    <option key={p._id} value={p._id}>{p.businessName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Scheduled Date */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {updateMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { if (window.confirm('Delete this request?')) deleteMutation.mutate(selected._id); }}
                className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50"
              >
                Del
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
