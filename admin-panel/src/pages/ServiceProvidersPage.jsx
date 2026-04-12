import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api, { serviceProvidersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import {
  IoAdd, IoTrash, IoPencil, IoEye, IoBriefcase, IoCheckmarkCircle,
  IoCloseCircle, IoBan, IoSearch, IoOptions
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  pending: { badge: 'badge-warning', label: 'Pending' },
  under_review: { badge: 'badge-info', label: 'Under Review' },
  approved: { badge: 'badge-success', label: 'Approved' },
  rejected: { badge: 'badge-error', label: 'Rejected' },
  suspended: { badge: 'badge-ghost', label: 'Suspended' }
};

const SUB_STYLES = {
  none: { badge: 'badge-ghost', label: 'No Subscription' },
  active: { badge: 'badge-success', label: 'Active' },
  expired: { badge: 'badge-error', label: 'Expired' },
  cancelled: { badge: 'badge-ghost', label: 'Cancelled' },
  pending_payment: { badge: 'badge-warning', label: 'Pending Payment' }
};

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'Free State', 'Northern Cape', 'North West',
];

const EMPTY_PROVIDER = {
  businessName: '', contactName: '', email: '', phone: '', website: '', bio: '',
  categoryId: '', province: '', city: '', password: '',
  serviceModes: [], serviceAreas: [],
};

const ServiceProvidersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', search: '', page: 1, limit: 20 });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_PROVIDER);
  const [areaInput, setAreaInput] = useState('');

  const createMutation = useMutation(
    (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(val => fd.append(k, val));
        else fd.append(k, v);
      });
      return api.post('/service-providers/apply', fd);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('service-providers');
        toast.success('Provider created successfully');
        setShowCreate(false);
        setCreateForm(EMPTY_PROVIDER);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed to create provider'),
    }
  );

  const { data: catsData } = useQuery('sp-categories', () => serviceProvidersAPI.getCategories(), { staleTime: 60000 });
  const categories = catsData?.data?.data || [];

  const { data, isLoading } = useQuery(
    ['service-providers', filters],
    () => serviceProvidersAPI.getAll(filters),
    { keepPreviousData: true }
  );

  const approveMutation = useMutation(({ id, notes }) => serviceProvidersAPI.approve(id, notes), {
    onSuccess: () => { queryClient.invalidateQueries('service-providers'); toast.success('Provider approved. Notification email sent.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Approval failed')
  });

  const rejectMutation = useMutation(({ id, reason }) => serviceProvidersAPI.reject(id, reason, ''), {
    onSuccess: () => { queryClient.invalidateQueries('service-providers'); toast.success('Application rejected.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Rejection failed')
  });

  const suspendMutation = useMutation((id) => serviceProvidersAPI.suspend(id), {
    onSuccess: () => { queryClient.invalidateQueries('service-providers'); toast.success('Provider suspended.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Suspend failed')
  });

  const deleteMutation = useMutation((id) => serviceProvidersAPI.delete(id), {
    onSuccess: () => { queryClient.invalidateQueries('service-providers'); toast.success('Provider deleted.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')
  });

  const providers = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const handleApprove = (id, name) => {
    const notes = window.prompt(`Approval notes for ${name} (optional):`);
    if (notes === null) return;
    approveMutation.mutate({ id, notes });
  };

  const handleReject = (id, name) => {
    const reason = window.prompt(`Rejection reason for ${name}:`);
    if (!reason) return;
    rejectMutation.mutate({ id, reason });
  };

  const statCounts = {
    pending: providers.filter(p => p.applicationStatus === 'pending').length,
    approved: providers.filter(p => p.applicationStatus === 'approved').length,
    active: providers.filter(p => p.subscriptionStatus === 'active').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Service Providers</h1>
          <p className="text-sm text-gray-500">Manage electricians, plumbers, and other service providers on the platform</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <IoAdd size={16} className="mr-1" /> Add Provider
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/service-providers/categories')}>
            <IoOptions size={16} className="mr-2" /> Categories
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/service-providers/plans')}>
            <IoBriefcase size={16} className="mr-2" /> Plans
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/service-providers/ad-slots')}>
            Ad Slots
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/service-provider-ads')}>
            All Ads
          </button>
        </div>
      </div>

      {/* Create Provider Panel */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Add New Service Provider</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name *</label>
                <input required value={createForm.businessName}
                  onChange={e => setCreateForm(f => ({ ...f, businessName: e.target.value }))}
                  className="input input-bordered input-sm w-full" placeholder="e.g. ABC Electrical" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person *</label>
                <input required value={createForm.contactName}
                  onChange={e => setCreateForm(f => ({ ...f, contactName: e.target.value }))}
                  className="input input-bordered input-sm w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                <input required type="email" value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="input input-bordered input-sm w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                <input required type="tel" value={createForm.phone}
                  onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  className="input input-bordered input-sm w-full" placeholder="0821234567" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Category</label>
                <select value={createForm.categoryId}
                  onChange={e => setCreateForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="select select-bordered select-sm w-full">
                  <option value="">— Select category —</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                <input type="url" value={createForm.website}
                  onChange={e => setCreateForm(f => ({ ...f, website: e.target.value }))}
                  className="input input-bordered input-sm w-full" placeholder="https://" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Province</label>
                <select value={createForm.province}
                  onChange={e => setCreateForm(f => ({ ...f, province: e.target.value }))}
                  className="select select-bordered select-sm w-full">
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input value={createForm.city}
                  onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))}
                  className="input input-bordered input-sm w-full" />
              </div>
            </div>

            {/* Service Modes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Services Offered</label>
              <div className="flex gap-4">
                {['repair', 'install', 'maintain'].map(m => (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox"
                      checked={createForm.serviceModes.includes(m)}
                      onChange={() => setCreateForm(f => ({
                        ...f,
                        serviceModes: f.serviceModes.includes(m)
                          ? f.serviceModes.filter(x => x !== m)
                          : [...f.serviceModes, m]
                      }))}
                      className="checkbox checkbox-xs checkbox-primary" />
                    <span className="text-sm capitalize">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Service Areas</label>
              <div className="flex gap-2 mb-2">
                <input value={areaInput} onChange={e => setAreaInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const v = areaInput.trim();
                      if (v && !createForm.serviceAreas.includes(v)) {
                        setCreateForm(f => ({ ...f, serviceAreas: [...f.serviceAreas, v] }));
                      }
                      setAreaInput('');
                    }
                  }}
                  className="input input-bordered input-sm flex-1" placeholder="Type area and press Enter" />
              </div>
              {createForm.serviceAreas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {createForm.serviceAreas.map(a => (
                    <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                      {a}
                      <button type="button" onClick={() => setCreateForm(f => ({ ...f, serviceAreas: f.serviceAreas.filter(x => x !== a) }))} className="text-blue-400 hover:text-blue-600">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">About / Bio</label>
              <textarea value={createForm.bio}
                onChange={e => setCreateForm(f => ({ ...f, bio: e.target.value }))}
                rows={2} className="textarea textarea-bordered textarea-sm w-full resize-none"
                placeholder="Brief description of services and experience" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temporary Password *</label>
              <input required type="password" minLength={6} value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                className="input input-bordered input-sm w-full" placeholder="Min. 6 characters" />
              <p className="text-xs text-gray-400 mt-1">Provider can change this after logging in</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createMutation.isLoading}
                className="btn btn-primary btn-sm">
                {createMutation.isLoading ? 'Creating...' : 'Create Provider'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: pagination.total ? providers.filter(p => p.applicationStatus === 'pending').length : '—', color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved Providers', value: pagination.total ? providers.filter(p => p.applicationStatus === 'approved').length : '—', color: 'text-green-600 bg-green-50' },
          { label: 'Active Subscriptions', value: pagination.total ? providers.filter(p => p.subscriptionStatus === 'active').length : '—', color: 'text-blue-600 bg-blue-50' },
        ].map((s, i) => (
          <Card key={i}><div className="p-4 flex items-center gap-3">
            <span className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</span>
            <span className="text-sm text-gray-500">{s.label}</span>
          </div></Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input input-bordered input-sm w-full pl-9"
            placeholder="Search providers..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>
        <select
          className="select select-bordered select-sm"
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_STYLES).map(([val, s]) => (
            <option key={val} value={val}>{s.label}</option>
          ))}
        </select>
        <select
          className="select select-bordered select-sm"
          value={filters.category || ''}
          onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <IoBriefcase size={48} className="text-gray-200" />
            <p className="text-gray-400">No service providers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Provider</th>
                  <th>Category</th>
                  <th>Application</th>
                  <th>Subscription</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => {
                  const appStatus = STATUS_STYLES[provider.applicationStatus] || { badge: 'badge-ghost', label: provider.applicationStatus };
                  const subStatus = SUB_STYLES[provider.subscriptionStatus] || { badge: 'badge-ghost', label: provider.subscriptionStatus };

                  return (
                    <tr key={provider._id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <IoBriefcase className="text-primary" size={18} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-800">{provider.businessName}</p>
                            <p className="text-xs text-gray-500">{provider.contactName} · {provider.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-700">
                          {provider.category?.icon} {provider.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${appStatus.badge}`}>{appStatus.label}</span>
                      </td>
                      <td>
                        <div>
                          <span className={`badge badge-sm ${subStatus.badge}`}>{subStatus.label}</span>
                          {provider.subscriptionPlan && (
                            <p className="text-xs text-gray-500 mt-0.5">{provider.subscriptionPlan.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">
                        {new Date(provider.applicationDate || provider.createdAt).toLocaleDateString('en-ZA')}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            title="View detail"
                            onClick={() => navigate(`/service-providers/${provider._id}`)}
                          ><IoEye size={14} /></button>

                          {provider.applicationStatus === 'pending' && (
                            <>
                              <button
                                className="btn btn-ghost btn-xs btn-square text-green-600"
                                title="Approve"
                                onClick={() => handleApprove(provider._id, provider.businessName)}
                              ><IoCheckmarkCircle size={16} /></button>
                              <button
                                className="btn btn-ghost btn-xs btn-square text-red-500"
                                title="Reject"
                                onClick={() => handleReject(provider._id, provider.businessName)}
                              ><IoCloseCircle size={16} /></button>
                            </>
                          )}

                          {provider.applicationStatus === 'approved' && (
                            <button
                              className="btn btn-ghost btn-xs btn-square text-amber-600"
                              title="Suspend"
                              onClick={() => { if (window.confirm(`Suspend ${provider.businessName}?`)) suspendMutation.mutate(provider._id); }}
                            ><IoBan size={14} /></button>
                          )}

                          <button
                            className="btn btn-ghost btn-xs btn-square text-red-500"
                            title="Delete"
                            onClick={() => { if (window.confirm(`Permanently delete ${provider.businessName}?`)) deleteMutation.mutate(provider._id); }}
                          ><IoTrash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-gray-500">{pagination.total} providers</span>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-ghost" disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
                  <span className="btn btn-sm btn-ghost pointer-events-none">{filters.page}/{pagination.pages}</span>
                  <button className="btn btn-sm btn-ghost" disabled={filters.page >= pagination.pages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ServiceProvidersPage;
