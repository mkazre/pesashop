import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceProvidersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoPencil, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const SLOT_PAGES = [
  { value: 'home', label: 'Home Page' },
  { value: 'archive', label: 'Product Archive' },
  { value: 'category', label: 'Category Page' },
  { value: 'product_detail', label: 'Product Detail' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'account', label: 'My Account' },
];
const DEFAULT = { slotId: '', slotLabel: '', slotPage: 'home', maxAds: 3, dailyRate: 0, weeklyRate: 0, monthlyRate: 0, yearlyRate: 0, isActive: true };

const ServiceProviderAdSlotsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);

  const { data, isLoading } = useQuery('sp-slots-admin', () => serviceProvidersAPI.getSlots());
  const slots = data?.data?.data || [];

  const saveMutation = useMutation(
    (data) => editing?._id
      ? serviceProvidersAPI.updateSlot(editing._id, data)
      : serviceProvidersAPI.createSlot(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sp-slots-admin');
        toast.success(editing?._id ? 'Slot updated' : 'Slot created');
        setEditing(null);
        setForm(DEFAULT);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed')
    }
  );

  const openNew = () => { setForm(DEFAULT); setEditing('new'); };
  const openEdit = (slot) => { setForm({ ...DEFAULT, ...slot }); setEditing(slot); };
  const handleSave = () => {
    if (!form.slotId.trim() || !form.slotLabel.trim()) return toast.error('Slot ID and label are required');
    saveMutation.mutate({
      ...form,
      maxAds: parseInt(form.maxAds) || 3,
      dailyRate: parseFloat(form.dailyRate) || 0,
      weeklyRate: parseFloat(form.weeklyRate) || 0,
      monthlyRate: parseFloat(form.monthlyRate) || 0,
      yearlyRate: parseFloat(form.yearlyRate) || 0,
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/service-providers')} className="btn btn-ghost btn-sm btn-square">
            <IoArrowBack size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ad Placement Slots</h1>
            <p className="text-sm text-gray-500">Manage where service provider ads can appear and their rates</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openNew}>
          <IoAdd size={16} /> Add Slot
        </button>
      </div>

      {editing && (
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">{editing === 'new' ? 'New Ad Slot' : `Edit: ${editing.slotLabel}`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slot ID * (no spaces)</label>
                <input className="input input-bordered w-full font-mono text-sm" value={form.slotId} onChange={(e) => setForm(f => ({ ...f, slotId: e.target.value.replace(/\s/g, '_') }))} placeholder="home_banner" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slot Label *</label>
                <input className="input input-bordered w-full" value={form.slotLabel} onChange={(e) => setForm(f => ({ ...f, slotLabel: e.target.value }))} placeholder="Home Banner" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                <select className="select select-bordered w-full" value={form.slotPage} onChange={(e) => setForm(f => ({ ...f, slotPage: e.target.value }))}>
                  {SLOT_PAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Ads in This Slot</label>
              <input type="number" min="1" max="20" className="input input-bordered w-28" value={form.maxAds} onChange={(e) => setForm(f => ({ ...f, maxAds: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rates (ZAR)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[['dailyRate', 'Per Day'], ['weeklyRate', 'Per Week'], ['monthlyRate', 'Per Month'], ['yearlyRate', 'Per Year']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input type="number" min="0" step="0.01" className="input input-bordered w-full" value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
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

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><span className="loading loading-spinner loading-md text-primary" /></div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-gray-400">No ad slots configured. Add your first slot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Slot ID</th>
                  <th>Label</th>
                  <th>Page</th>
                  <th>Max Ads</th>
                  <th>Monthly Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot._id} className="hover">
                    <td><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{slot.slotId}</code></td>
                    <td className="text-sm text-gray-700">{slot.slotLabel}</td>
                    <td><span className="badge badge-xs badge-ghost capitalize">{slot.slotPage?.replace('_', ' ')}</span></td>
                    <td className="text-sm text-gray-600">{slot.maxAds}</td>
                    <td className="text-sm font-medium text-gray-700">R{slot.monthlyRate?.toLocaleString()}</td>
                    <td><span className={`badge badge-sm ${slot.isActive ? 'badge-success' : 'badge-ghost'}`}>{slot.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs btn-square" onClick={() => openEdit(slot)}><IoPencil size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ServiceProviderAdSlotsPage;
