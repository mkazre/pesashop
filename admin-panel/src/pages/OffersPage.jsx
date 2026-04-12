import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoPencil, IoEye, IoGift, IoPeople, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const TYPE_LABELS = {
  purchasable: { label: 'Purchasable', color: 'badge-success' },
  subscription: { label: 'Subscription', color: 'badge-info' },
  contact_request: { label: 'Contact Request', color: 'badge-warning' }
};

const OffersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ type: '', status: '' });

  const { data, isLoading } = useQuery(
    ['offers-admin', filter],
    () => offersAPI.getAll(filter),
    { refetchOnWindowFocus: false }
  );

  const deleteMutation = useMutation((id) => offersAPI.delete(id), {
    onSuccess: () => { queryClient.invalidateQueries('offers-admin'); toast.success('Offer deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')
  });

  const toggleMutation = useMutation(({ id, isActive }) => offersAPI.update(id, { isActive }), {
    onSuccess: () => { queryClient.invalidateQueries('offers-admin'); toast.success('Offer status updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed')
  });

  const offers = data?.data?.data || [];

  const stats = {
    total: offers.length,
    active: offers.filter(o => o.isActive).length,
    totalRevenue: offers.reduce((s, o) => s + (o.stats?.conversions || 0) * (o.pricing?.amount || 0), 0),
    pendingContact: offers.reduce((s, o) => s + (o.offerType === 'contact_request' ? (o.stats?.conversions || 0) : 0), 0)
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Offers</h1>
          <p className="text-sm text-gray-500">Create and manage value-added offers for your customers</p>
        </div>
        <Button onClick={() => navigate('/offers/new')}>
          <IoAdd size={18} className="mr-2" /> Create Offer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Offers', value: stats.total, icon: IoGift, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: stats.active, icon: IoCheckmarkCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Conversions Revenue', value: `R${stats.totalRevenue.toFixed(2)}`, icon: IoGift, color: 'bg-purple-50 text-purple-600' },
          { label: 'Pending Contact', value: stats.pendingContact, icon: IoPeople, color: 'bg-amber-50 text-amber-600' }
        ].map((s, i) => (
          <Card key={i}>
            <div className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="select select-bordered select-sm"
          value={filter.type}
          onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="purchasable">Purchasable</option>
          <option value="subscription">Subscription</option>
          <option value="contact_request">Contact Request</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={filter.status}
          onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Offers Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <IoGift size={48} className="text-gray-200" />
            <p className="text-gray-400">No offers yet. Create your first offer to get started.</p>
            <Button size="sm" onClick={() => navigate('/offers/new')}>
              <IoAdd size={16} className="mr-1" /> Create Offer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th>Offer</th>
                  <th>Type</th>
                  <th>Display Pages</th>
                  <th>Views</th>
                  <th>Conversions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const typeInfo = TYPE_LABELS[offer.offerType] || { label: offer.offerType, color: 'badge-ghost' };
                  return (
                    <tr key={offer._id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          {offer.logoUrl ? (
                            <img src={offer.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IoGift className="text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-800">{offer.title}</p>
                            <p className="text-xs text-gray-500">{offer.providerName || 'Internal'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${typeInfo.color}`}>{typeInfo.label}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(offer.displayPages || []).map((p) => (
                            <span key={p} className="badge badge-xs badge-ghost capitalize">{p.replace('_', ' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{offer.stats?.views || 0}</td>
                      <td className="text-sm text-gray-600">{offer.stats?.conversions || 0}</td>
                      <td>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={offer.isActive}
                            onChange={(e) => toggleMutation.mutate({ id: offer._id, isActive: e.target.checked })}
                            className="toggle toggle-sm toggle-primary"
                          />
                          <span className={`text-xs font-medium ${offer.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {offer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={() => navigate(`/offers/${offer._id}/customers`)}
                            title="View customers"
                          ><IoPeople size={14} /></button>
                          <button
                            className="btn btn-ghost btn-xs btn-square"
                            onClick={() => navigate(`/offers/${offer._id}`)}
                            title="Edit"
                          ><IoPencil size={14} /></button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-red-500"
                            title="Delete"
                            onClick={() => {
                              if (window.confirm(`Delete "${offer.title}"? This cannot be undone.`)) {
                                deleteMutation.mutate(offer._id);
                              }
                            }}
                          ><IoTrash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OffersPage;
