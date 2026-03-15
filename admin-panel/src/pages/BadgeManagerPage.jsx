import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  IoAdd, IoTrash, IoSearch, IoCopy, IoEllipsisVertical,
  IoToggle, IoEye, IoEyeOff, IoCreate, IoChevronDown,
  IoShieldCheckmark, IoFlash, IoStar, IoTime, IoPricetag,
  IoWarning, IoRocket, IoSparkles
} from 'react-icons/io5';
import { useAuthStore } from '@/store';
import BadgeEditorModal from '@/components/badges/BadgeEditorModal';
import BadgePreview from '@/components/badges/BadgePreview';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const fetchBadges = async (token, params) => {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/badges?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch badges');
  return res.json();
};

const CONDITION_LABELS = {
  static: 'Static (Always Show)',
  on_sale: 'On Sale',
  top_selling: 'Top Selling',
  new_arrival: 'New Arrival',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  back_in_stock: 'Back in Stock',
  price_range: 'Price Range',
  high_rated: 'High Rated',
  most_reviewed: 'Most Reviewed',
  featured: 'Featured',
  free_shipping: 'Free Shipping',
  clearance: 'Clearance',
  limited_edition: 'Limited Edition',
  percentage_off: 'Percentage Off',
  bundle_deal: 'Bundle Deal',
  member_only: 'Member Only',
  pre_order: 'Pre-Order',
  seasonal: 'Seasonal',
  specific_products: 'Specific Products',
  specific_categories: 'Specific Categories',
  specific_tags: 'Specific Tags',
  specific_brands: 'Specific Brands',
  category_sale: 'Category Sale',
  category_featured: 'Category Featured',
  scheduled: 'Scheduled',
  custom_field: 'Custom Field',
};

const CONDITION_ICONS = {
  on_sale: IoPricetag,
  top_selling: IoRocket,
  new_arrival: IoSparkles,
  low_stock: IoWarning,
  out_of_stock: IoWarning,
  featured: IoStar,
  scheduled: IoTime,
  static: IoShieldCheckmark,
};

const BadgeManagerPage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const params = { page, limit: 20, search };
  if (filterActive !== 'all') params.isActive = filterActive;

  const { data, isLoading, error } = useQuery(
    ['badges', params],
    () => fetchBadges(token, params),
    { keepPreviousData: true }
  );

  const badges = data?.data || [];
  const pagination = data?.pagination || {};

  // Mutations
  const deleteMutation = useMutation(
    (id) => fetch(`${API}/badges/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
    { onSuccess: () => { queryClient.invalidateQueries('badges'); toast.success('Badge deleted'); } }
  );

  const toggleMutation = useMutation(
    (id) => fetch(`${API}/badges/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
    { onSuccess: () => { queryClient.invalidateQueries('badges'); } }
  );

  const duplicateMutation = useMutation(
    (id) => fetch(`${API}/badges/${id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
    { onSuccess: () => { queryClient.invalidateQueries('badges'); toast.success('Badge duplicated'); } }
  );

  const bulkDeleteMutation = useMutation(
    (ids) => fetch(`${API}/badges/bulk-delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }),
    { onSuccess: () => { queryClient.invalidateQueries('badges'); setSelectedBadges([]); toast.success('Badges deleted'); } }
  );

  const handleCreate = () => {
    setEditingBadge(null);
    setEditorOpen(true);
  };

  const handleEdit = (badge) => {
    setEditingBadge(badge);
    setEditorOpen(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete badge "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedBadges.length === 0) return;
    if (window.confirm(`Delete ${selectedBadges.length} badges?`)) {
      bulkDeleteMutation.mutate(selectedBadges);
    }
  };

  const toggleSelect = (id) => {
    setSelectedBadges((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedBadges.length === badges.length) {
      setSelectedBadges([]);
    } else {
      setSelectedBadges(badges.map((b) => b._id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badge Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage product badges with smart rules and advanced styling</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          <IoAdd size={18} />
          Create Badge
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Badges', value: pagination.total || 0, color: 'blue' },
          { label: 'Active', value: badges.filter((b) => b.isActive).length, color: 'green' },
          { label: 'Conditional', value: badges.filter((b) => b.conditions?.length > 0).length, color: 'purple' },
          { label: 'Static', value: badges.filter((b) => !b.conditions?.length || b.conditions?.some((c) => c.type === 'static')).length, color: 'gray' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search badges..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Filter */}
          <select
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          {/* Bulk actions */}
          {selectedBadges.length > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
              <IoTrash size={14} />
              Delete ({selectedBadges.length})
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading badges...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">Error loading badges</div>
        ) : badges.length === 0 ? (
          <div className="p-12 text-center">
            <IoShieldCheckmark size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No badges yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first badge to get started</p>
            <button onClick={handleCreate} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">
              Create Badge
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedBadges.length === badges.length && badges.length > 0} onChange={selectAll} className="rounded" />
                  </th>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Conditions</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {badges.map((badge) => (
                  <tr key={badge._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedBadges.includes(badge._id)} onChange={() => toggleSelect(badge._id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <BadgePreview badge={badge} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{badge.name}</p>
                        {badge.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{badge.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {badge.conditions?.length > 0 ? badge.conditions.map((cond, i) => {
                          const Icon = CONDITION_ICONS[cond.type] || IoFlash;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium">
                              <Icon size={10} />
                              {CONDITION_LABELS[cond.type] || cond.type}
                            </span>
                          );
                        }) : (
                          <span className="text-xs text-gray-400">Manual only</span>
                        )}
                        {badge.conditionLogic === 'any' && badge.conditions?.length > 1 && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">OR</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-600">{badge.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleMutation.mutate(badge._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          badge.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {badge.isActive ? <IoEye size={12} /> : <IoEyeOff size={12} />}
                        {badge.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {badge.startDate || badge.endDate ? (
                        <div className="text-xs text-gray-500">
                          {badge.startDate && <div>From: {new Date(badge.startDate).toLocaleDateString()}</div>}
                          {badge.endDate && <div>Until: {new Date(badge.endDate).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Always</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            if (menuOpen === badge._id) { setMenuOpen(null); return; }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            setMenuOpen(badge._id);
                          }}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        >
                          <IoEllipsisVertical size={16} className="text-gray-400" />
                        </button>
                        {menuOpen === badge._id && (
                          <>
                            <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(null)} />
                            <div className="fixed w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] py-1" style={{ top: menuPos.top, right: menuPos.right }}>
                              <button onClick={() => { handleEdit(badge); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <IoCreate size={14} /> Edit
                              </button>
                              <button onClick={() => { duplicateMutation.mutate(badge._id); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <IoCopy size={14} /> Duplicate
                              </button>
                              <button onClick={() => { toggleMutation.mutate(badge._id); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <IoToggle size={14} /> {badge.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button onClick={() => { handleDelete(badge._id, badge.name); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                <IoTrash size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs rounded ${p === page ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <BadgeEditorModal
          badge={editingBadge}
          onClose={() => { setEditorOpen(false); setEditingBadge(null); }}
          onSaved={() => { queryClient.invalidateQueries('badges'); setEditorOpen(false); setEditingBadge(null); }}
        />
      )}
    </div>
  );
};

export default BadgeManagerPage;
