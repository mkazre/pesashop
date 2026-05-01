import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceProvidersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import toast from '@/utils/toast';
import IconPicker from '@/components/common/IconPicker';
import SmartIcon from '@/components/common/SmartIcon';
import { IoAdd, IoTrash, IoPencil, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const DEFAULT = { name: '', icon: '🔧', description: '', keywords: '', isActive: true };

const ServiceProviderCategoriesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | category object
  const [form, setForm] = useState(DEFAULT);

  const { data, isLoading } = useQuery('sp-categories-admin', () => serviceProvidersAPI.getCategories());
  const categories = data?.data?.data || [];

  const saveMutation = useMutation(
    (data) => editing?._id
      ? serviceProvidersAPI.updateCategory(editing._id, data)
      : serviceProvidersAPI.createCategory(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sp-categories-admin');
        queryClient.invalidateQueries('sp-categories');
        toast.success(editing?._id ? 'Category updated' : 'Category created');
        setEditing(null);
        setForm(DEFAULT);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Save failed')
    }
  );

  const deleteMutation = useMutation((id) => serviceProvidersAPI.deleteCategory(id), {
    onSuccess: () => { queryClient.invalidateQueries('sp-categories-admin'); toast.success('Category deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')
  });

  const openNew = () => { setForm(DEFAULT); setEditing('new'); };
  const openEdit = (cat) => { setForm({ ...DEFAULT, ...cat, keywords: (cat.keywords || []).join(', ') }); setEditing(cat); };
  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Category name is required');
    saveMutation.mutate({
      ...form,
      keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
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
            <h1 className="text-2xl font-bold text-gray-800">Service Provider Categories</h1>
            <p className="text-sm text-gray-500">Manage categories like Electrical, Plumbing, Landscaping</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openNew}>
          <IoAdd size={16} /> Add Category
        </button>
      </div>

      {/* Form */}
      {editing && (
        <Card>
          <div className="p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">{editing === 'new' ? 'New Category' : `Edit: ${editing.name}`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <IconPicker label="Icon" value={form.icon} onChange={(v) => setForm(f => ({ ...f, icon: v }))} />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input className="input input-bordered w-full" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electrical, Plumbing, Landscaping" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input className="input input-bordered w-full" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description of this category" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Keywords (comma-separated)</label>
              <input className="input input-bordered w-full" value={form.keywords} onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. electrical, wiring, circuits, power, lighting" />
              <p className="text-xs text-gray-400 mt-1">Used for AI contextual ad matching</p>
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

      {/* List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><span className="loading loading-spinner loading-md text-primary" /></div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-gray-400">No categories yet. Add your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <span><SmartIcon value={cat.icon} fallback="🔧" size={24} /></span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{cat.name}</p>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                  {cat.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.keywords.map((k, i) => <span key={i} className="badge badge-xs badge-ghost">{k}</span>)}
                    </div>
                  )}
                </div>
                <span className={`badge badge-sm ${cat.isActive ? 'badge-success' : 'badge-ghost'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-xs btn-square" onClick={() => openEdit(cat)}><IoPencil size={14} /></button>
                  <button
                    className="btn btn-ghost btn-xs btn-square text-red-500"
                    onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }}
                  ><IoTrash size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ServiceProviderCategoriesPage;
