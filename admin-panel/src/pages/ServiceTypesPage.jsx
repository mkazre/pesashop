import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import IconPicker from '@/components/common/IconPicker';
import SmartIcon from '@/components/common/SmartIcon';

const MODES = [
  { value: 'repair',   label: 'Repair' },
  { value: 'install',  label: 'Install' },
  { value: 'maintain', label: 'Maintain' },
];

const EMPTY = {
  title: '', description: '', icon: '🔧', imageUrl: '',
  serviceModes: ['repair', 'install', 'maintain'],
  areasServiced: [],
  linkedCategories: [],
  filterBehavior: 'linked_categories_only',
  isActive: true, displayOrder: 0,
};

export default function ServiceTypesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [areaInput, setAreaInput] = useState('');

  const { data, isLoading } = useQuery('admin-service-types', () =>
    api.get('/service-types/admin/all').then(r => r.data.data)
  );

  const { data: catData } = useQuery('categories-list', () =>
    api.get('/categories?limit=200').then(r => r.data.categories || r.data.data || [])
  );
  const categories = catData || [];

  const saveMutation = useMutation(
    (d) => editing
      ? api.put(`/service-types/${editing._id}`, d)
      : api.post('/service-types', d),
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-service-types');
        toast.success(editing ? 'Updated' : 'Created');
        setShowForm(false); setEditing(null); setForm(EMPTY);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Error'),
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/service-types/${id}`),
    {
      onSuccess: () => { qc.invalidateQueries('admin-service-types'); toast.success('Deleted'); },
    }
  );

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      ...EMPTY,
      ...item,
      linkedCategories: (item.linkedCategories || []).map(c => typeof c === 'object' ? c._id : c),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMode = (m) => {
    setForm(f => ({
      ...f,
      serviceModes: f.serviceModes.includes(m)
        ? f.serviceModes.filter(x => x !== m)
        : [...f.serviceModes, m],
    }));
  };

  const toggleCat = (id) => {
    setForm(f => ({
      ...f,
      linkedCategories: f.linkedCategories.includes(id)
        ? f.linkedCategories.filter(x => x !== id)
        : [...f.linkedCategories, id],
    }));
  };

  const addArea = () => {
    const v = areaInput.trim();
    if (!v || form.areasServiced.includes(v)) return;
    setForm(f => ({ ...f, areasServiced: [...f.areasServiced, v] }));
    setAreaInput('');
  };

  const removeArea = (a) => setForm(f => ({ ...f, areasServiced: f.areasServiced.filter(x => x !== a) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const STATUS = {
    new: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Types</h1>
          <p className="text-sm text-gray-500 mt-1">Define the services offered on your platform (repairs, installations, etc.)</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Service Type
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{editing ? 'Edit' : 'New'} Service Type</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Icon */}
              <IconPicker label="Icon" value={form.icon} onChange={(v) => setForm(f => ({ ...f, icon: v }))} />
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g. Electrical Services"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
                placeholder="Brief description shown to customers"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://..."
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="mt-2 h-20 rounded-lg object-cover border" />
              )}
            </div>

            {/* Service Modes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Modes</label>
              <div className="flex gap-3">
                {MODES.map(m => (
                  <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.serviceModes.includes(m.value)}
                      onChange={() => toggleMode(m.value)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Areas Serviced */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Areas Serviced</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={areaInput}
                  onChange={e => setAreaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Johannesburg North, Sandton, Midrand"
                />
                <button type="button" onClick={addArea} className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200">
                  Add
                </button>
              </div>
              {form.areasServiced.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.areasServiced.map(a => (
                    <span key={a} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                      {a}
                      <button type="button" onClick={() => removeArea(a)} className="text-blue-400 hover:text-blue-600">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility / Filter Behavior */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Where to show this service</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterBehavior"
                    value="all_products"
                    checked={form.filterBehavior === 'all_products'}
                    onChange={() => setForm(f => ({ ...f, filterBehavior: 'all_products' }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">All products & categories</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="filterBehavior"
                    value="linked_categories_only"
                    checked={form.filterBehavior === 'linked_categories_only'}
                    onChange={() => setForm(f => ({ ...f, filterBehavior: 'linked_categories_only' }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Only in selected categories below</span>
                </label>
              </div>
            </div>

            {/* Linked Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked Product Categories</label>
                <p className="text-xs text-gray-500 mb-2">
                  {form.filterBehavior === 'all_products'
                    ? 'Categories are ignored when "All products" is selected above'
                    : 'Service widget shows only on products in these categories'}
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map(c => (
                    <label key={c._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.linkedCategories.includes(c._id)}
                        onChange={() => toggleCat(c._id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Status & Order */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saveMutation.isLoading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No service types yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Modes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Areas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Categories</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><SmartIcon value={item.icon} fallback="🔧" size={22} /></div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.serviceModes || []).map(m => (
                        <span key={m} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs capitalize">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600">{(item.areasServiced || []).slice(0, 3).join(', ')}{(item.areasServiced || []).length > 3 ? ` +${item.areasServiced.length - 3}` : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-500">{(item.linkedCategories || []).length} linked</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                      <button
                        onClick={() => { if (window.confirm('Delete this service type?')) deleteMutation.mutate(item._id); }}
                        className="text-xs text-red-500 hover:text-red-600"
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
      )}
    </div>
  );
}
