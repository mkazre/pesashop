import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceProvidersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoPencil, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const BILLING_CYCLES = ['monthly', 'quarterly', 'annually'];
const DEFAULT = { name: '', price: 0, billingCycle: 'monthly', maxActiveAds: 1, featuresIncluded: '', isActive: true };

const ServiceProviderPlansPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);

  const { data, isLoading } = useQuery('sp-plans-admin', () => serviceProvidersAPI.getPlans());
  const plans = data?.data?.data || [];

  const saveMutation = useMutation(
    (data) => editing?._id
      ? serviceProvidersAPI.updatePlan(editing._id, data)
      : serviceProvidersAPI.createPlan(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sp-plans-admin');
        toast.success(editing?._id ? 'Plan updated' : 'Plan created');
        setEditing(null);
        setForm(DEFAULT);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed')
    }
  );

  const deleteMutation = useMutation((id) => serviceProvidersAPI.deletePlan(id), {
    onSuccess: () => { queryClient.invalidateQueries('sp-plans-admin'); toast.success('Plan deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')
  });

  const openNew = () => { setForm(DEFAULT); setEditing('new'); };
  const openEdit = (plan) => { setForm({ ...DEFAULT, ...plan, featuresIncluded: (plan.featuresIncluded || []).join('\n') }); setEditing(plan); };
  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Plan name is required');
    saveMutation.mutate({
      ...form,
      price: parseFloat(form.price) || 0,
      maxActiveAds: parseInt(form.maxActiveAds) || 1,
      featuresIncluded: form.featuresIncluded ? form.featuresIncluded.split('\n').map(f => f.trim()).filter(Boolean) : []
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/service-providers')} className="btn btn-ghost btn-sm btn-square">
            <IoArrowBack size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
            <p className="text-sm text-gray-500">Manage the plans service providers can subscribe to</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openNew}>
          <IoAdd size={16} /> Add Plan
        </button>
      </div>

      {editing && (
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">{editing === 'new' ? 'New Subscription Plan' : `Edit: ${editing.name}`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input className="input input-bordered w-full" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starter, Professional, Enterprise" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                <select className="select select-bordered w-full" value={form.billingCycle} onChange={(e) => setForm(f => ({ ...f, billingCycle: e.target.value }))}>
                  {BILLING_CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (ZAR)</label>
                <input type="number" min="0" step="0.01" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Ads</label>
                <input type="number" min="0" className="input input-bordered w-full" value={form.maxActiveAds} onChange={(e) => setForm(f => ({ ...f, maxActiveAds: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Features Included (one per line)</label>
              <textarea className="textarea textarea-bordered w-full h-28" value={form.featuresIncluded} onChange={(e) => setForm(f => ({ ...f, featuresIncluded: e.target.value }))} placeholder="Profile listing&#10;1 active ad&#10;Category badge&#10;Priority placement" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm gap-2" onClick={handleSave} disabled={saveMutation.isLoading}>
                <IoCheckmarkCircle size={16} /> {editing === 'new' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center h-32"><span className="loading loading-spinner loading-md text-primary" /></div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-gray-400">No plans yet. Create your first subscription plan.</p>
          </div>
        ) : plans.map((plan) => (
          <Card key={plan._id}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{plan.name}</h3>
                  <p className="text-2xl font-black text-primary mt-1">R{plan.price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">per {plan.billingCycle}</p>
                </div>
                <span className={`badge badge-sm ${plan.isActive ? 'badge-success' : 'badge-ghost'}`}>{plan.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500">Up to {plan.maxActiveAds} active ad{plan.maxActiveAds !== 1 ? 's' : ''}</p>
                {(plan.featuresIncluded || []).map((f, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><span className="text-primary">✓</span>{f}</p>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button className="btn btn-ghost btn-xs gap-1 flex-1" onClick={() => openEdit(plan)}><IoPencil size={12} /> Edit</button>
                <button className="btn btn-ghost btn-xs text-red-500" onClick={() => { if (window.confirm(`Delete "${plan.name}"?`)) deleteMutation.mutate(plan._id); }}><IoTrash size={12} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceProviderPlansPage;
