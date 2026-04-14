import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api, { serviceProvidersAPI } from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
};

const SUB_BADGE = {
  none: 'bg-gray-100 text-gray-500',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-400',
  pending_payment: 'bg-amber-100 text-amber-700',
};

export default function ServiceProviderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['service-provider-detail', id],
    () => serviceProvidersAPI.getOne(id),
    { staleTime: 60000 }
  );
  const provider = data?.data?.data || data?.data || null;

  // Assigned service requests
  const { data: reqData } = useQuery(
    ['sp-assigned-requests', id],
    () => api.get('/service-requests', { params: { providerId: id, limit: 20 } }).then(r => r.data),
    { staleTime: 60000 }
  );
  const assignedRequests = reqData?.data || [];

  const approveMutation = useMutation(({ id, notes }) => serviceProvidersAPI.approve(id, notes), {
    onSuccess: () => { qc.invalidateQueries(['service-provider-detail', id]); toast.success('Provider approved'); },
    onError: e => toast.error(e.response?.data?.message || 'Error'),
  });
  const rejectMutation = useMutation(({ id, reason }) => serviceProvidersAPI.reject(id, reason, ''), {
    onSuccess: () => { qc.invalidateQueries(['service-provider-detail', id]); toast.success('Provider rejected'); },
    onError: e => toast.error(e.response?.data?.message || 'Error'),
  });
  const suspendMutation = useMutation((id) => serviceProvidersAPI.suspend(id), {
    onSuccess: () => { qc.invalidateQueries(['service-provider-detail', id]); toast.success('Provider suspended'); },
    onError: e => toast.error(e.response?.data?.message || 'Error'),
  });

  if (isLoading) return (
    <div className="flex justify-center py-24">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !provider) return (
    <div className="p-8 text-center text-gray-500">
      <p className="font-medium text-gray-700">
        {error ? (error.response?.data?.message || error.message || 'Failed to load provider') : 'Provider not found.'}
      </p>
      {error?.response?.status === 403 && (
        <p className="text-sm text-red-500 mt-1">Access denied — insufficient permissions.</p>
      )}
      <button onClick={() => navigate('/service-providers')} className="mt-4 text-blue-600 hover:underline text-sm">← Back to providers</button>
    </div>
  );

  const appStatus = provider.applicationStatus || 'pending';
  const subStatus = provider.subscriptionStatus || 'none';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/service-providers')} className="text-gray-400 hover:text-gray-600 text-sm">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
            <p className="text-sm text-gray-500">{provider.contactName} · {provider.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {appStatus === 'pending' && (
            <>
              <button
                onClick={() => { const n = window.prompt('Approval notes (optional):'); if (n !== null) approveMutation.mutate({ id, notes: n }); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => { const r = window.prompt('Rejection reason:'); if (r) rejectMutation.mutate({ id, reason: r }); }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
          {appStatus === 'approved' && (
            <button
              onClick={() => { if (window.confirm('Suspend this provider?')) suspendMutation.mutate(id); }}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column — profile */}
        <div className="md:col-span-2 space-y-5">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Application Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[appStatus] || 'bg-gray-100 text-gray-600'}`}>
                {appStatus.replace('_', ' ').toUpperCase()}
              </span>
              {provider.reviewNotes && <p className="text-xs text-gray-500 mt-2">Notes: {provider.reviewNotes}</p>}
              {provider.rejectionReason && <p className="text-xs text-red-500 mt-1">Reason: {provider.rejectionReason}</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Subscription</p>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${SUB_BADGE[subStatus] || 'bg-gray-100 text-gray-600'}`}>
                {subStatus.replace('_', ' ').toUpperCase()}
              </span>
              {provider.subscriptionExpiry && (
                <p className="text-xs text-gray-500 mt-2">Expires: {new Date(provider.subscriptionExpiry).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Business Information</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Business Name', provider.businessName],
                ['Contact Person', provider.contactName],
                ['Email', provider.email],
                ['Phone', provider.phone || '—'],
                ['Website', provider.website || '—'],
                ['Province', provider.province || '—'],
                ['City', provider.city || '—'],
                ['Category', provider.category?.name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 truncate">{value}</dd>
                </div>
              ))}
            </dl>

            {provider.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">About</p>
                <p className="text-sm text-gray-700">{provider.bio}</p>
              </div>
            )}

            {(provider.serviceAreas || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Service Areas</p>
                <div className="flex flex-wrap gap-2">
                  {provider.serviceAreas.map(a => (
                    <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {(provider.serviceModes || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Service Modes</p>
                <div className="flex gap-2">
                  {provider.serviceModes.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs capitalize">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Application Documents</h3>
            {(provider.documents || []).length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {provider.documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg">
                    <span className="text-gray-400 text-sm">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.label || doc.type}</p>
                      <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Requests */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Assigned Service Requests</h3>
            {assignedRequests.length === 0 ? (
              <p className="text-sm text-gray-400">No service requests assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {assignedRequests.map(req => (
                  <div key={req._id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{req.serviceType?.title} — {req.firstName} {req.lastName}</p>
                      <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      req.status === 'completed' ? 'bg-green-100 text-green-700' :
                      req.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — sidebar stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Applied</p>
            <p className="font-semibold text-gray-900 text-sm mt-1">
              {provider.createdAt ? new Date(provider.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="font-semibold text-gray-900 text-sm mt-1">
              {provider.rating ? `⭐ ${provider.rating.toFixed(1)} (${provider.reviewCount || 0} reviews)` : 'No reviews yet'}
            </p>
          </div>
          {provider.isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-700 font-bold">✓ Verified Provider</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
