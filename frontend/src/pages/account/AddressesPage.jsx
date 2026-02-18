import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

const EMPTY_ADDRESS = {
  type: 'billing',
  firstName: '',
  lastName: '',
  company: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  country: 'South Africa',
  postalCode: '',
  phone: '',
  isDefault: false,
};

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

function AddressForm({ address, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(address || EMPTY_ADDRESS);
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.street || !form.city || !form.state || !form.postalCode) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div className="flex gap-3">
        {['billing', 'shipping'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => update('type', t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.type === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {t === 'billing' ? 'Billing' : 'Shipping'}
          </button>
        ))}
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <input type="text" value={form.company || ''} onChange={e => update('company', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
      </div>

      {/* Street */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
        <input type="text" value={form.street} onChange={e => update('street', e.target.value)} required placeholder="House number and street name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        <input type="text" value={form.street2 || ''} onChange={e => update('street2', e.target.value)} placeholder="Apartment, suite, unit, etc. (optional)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input type="text" value={form.city} onChange={e => update('city', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Province / State *</label>
          <select value={form.state} onChange={e => update('state', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent">
            <option value="">Select...</option>
            {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Postal + Country */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
          <input type="text" value={form.postalCode} onChange={e => update('postalCode', e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input type="tel" value={form.phone || ''} onChange={e => update('phone', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
      </div>

      {/* Default */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isDefault} onChange={e => update('isDefault', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
        <span className="text-sm text-gray-700">Set as default {form.type} address</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSaving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
          {isSaving ? 'Saving...' : (address?._id ? 'Update Address' : 'Add Address')}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const [editing, setEditing] = useState(null); // null | 'new' | address object
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('myAddresses', () => authAPI.getAddresses(), { retry: 1 });
  const addresses = data?.data?.data || [];

  const addMutation = useMutation((data) => authAPI.addAddress(data), {
    onSuccess: () => { queryClient.invalidateQueries('myAddresses'); setEditing(null); toast.success('Address added'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add address'),
  });

  const updateMutation = useMutation(({ id, data }) => authAPI.updateAddress(id, data), {
    onSuccess: () => { queryClient.invalidateQueries('myAddresses'); setEditing(null); toast.success('Address updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update address'),
  });

  const deleteMutation = useMutation((id) => authAPI.deleteAddress(id), {
    onSuccess: () => { queryClient.invalidateQueries('myAddresses'); toast.success('Address deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete address'),
  });

  const handleSave = (formData) => {
    if (editing && editing._id) {
      updateMutation.mutate({ id: editing._id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteMutation.mutate(id);
    }
  };

  const billingAddresses = addresses.filter(a => a.type === 'billing');
  const shippingAddresses = addresses.filter(a => a.type === 'shipping');

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
        <p className="text-gray-500 mt-3">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
        {!editing && (
          <button onClick={() => setEditing('new')}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Address
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {editing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editing === 'new' ? 'Add New Address' : 'Edit Address'}
          </h2>
          <AddressForm
            address={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            isSaving={addMutation.isLoading || updateMutation.isLoading}
          />
        </div>
      )}

      {/* Billing Addresses */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Billing Addresses</h2>
        {billingAddresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">No billing addresses saved yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {billingAddresses.map(addr => (
              <AddressCard key={addr._id} address={addr} onEdit={() => setEditing(addr)} onDelete={() => handleDelete(addr._id)} />
            ))}
          </div>
        )}
      </div>

      {/* Shipping Addresses */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Shipping Addresses</h2>
        {shippingAddresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">No shipping addresses saved yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {shippingAddresses.map(addr => (
              <AddressCard key={addr._id} address={addr} onEdit={() => setEditing(addr)} onDelete={() => handleDelete(addr._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddressCard({ address, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
      {address.isDefault && (
        <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Default</span>
      )}
      <div className="text-sm text-gray-600 space-y-0.5">
        <p className="font-semibold text-gray-900">{address.firstName} {address.lastName}</p>
        {address.company && <p>{address.company}</p>}
        <p>{address.street}</p>
        {address.street2 && <p>{address.street2}</p>}
        <p>{address.city}, {address.state} {address.postalCode}</p>
        <p>{address.country}</p>
        {address.phone && <p className="mt-1 text-gray-500">{address.phone}</p>}
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
        <button onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Edit
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={onDelete}
          className="text-sm text-red-500 hover:text-red-600 font-medium">
          Delete
        </button>
      </div>
    </div>
  );
}
