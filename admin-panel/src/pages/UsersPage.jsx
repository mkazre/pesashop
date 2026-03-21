import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from '@/utils/toast';
import {
  IoAdd, IoSearch, IoTrash, IoCreate, IoEllipsisVertical,
  IoShieldCheckmark, IoPersonCircle, IoClose, IoEye, IoEyeOff,
  IoPeople, IoPersonAdd, IoCheckmarkCircle, IoCloseCircle,
} from 'react-icons/io5';
import { usersAPI, rolesAPI } from '@/services/api';

const ROLE_LABELS = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  shop_manager: { label: 'Shop Manager', color: 'bg-blue-100 text-blue-700' },
  customer: { label: 'Customer', color: 'bg-gray-100 text-gray-700' },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'customer', isActive: true, customerGroup: 'retail' });

  const { data: statsData } = useQuery('userStats', () => usersAPI.getStats().then(r => r.data?.data));
  const { data: usersData, isLoading } = useQuery(
    ['users', page, search, roleFilter, statusFilter],
    () => usersAPI.getAll({ page, limit: 20, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined }).then(r => r.data),
    { keepPreviousData: true }
  );
  const { data: rolesData } = useQuery('roles', () => rolesAPI.getAll().then(r => r.data?.data), { staleTime: 60000 });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination || {};
  const stats = statsData || {};

  const createMutation = useMutation(data => usersAPI.create(data), {
    onSuccess: () => { toast.success('User created'); queryClient.invalidateQueries('users'); queryClient.invalidateQueries('userStats'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation(({ id, data }) => usersAPI.update(id, data), {
    onSuccess: () => { toast.success('User updated'); queryClient.invalidateQueries('users'); queryClient.invalidateQueries('userStats'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update user'),
  });

  const deleteMutation = useMutation(id => usersAPI.delete(id), {
    onSuccess: () => { toast.success('User deleted'); queryClient.invalidateQueries('users'); queryClient.invalidateQueries('userStats'); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete user'),
  });

  const toggleMutation = useMutation(id => usersAPI.toggleStatus(id), {
    onSuccess: () => { queryClient.invalidateQueries('users'); queryClient.invalidateQueries('userStats'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditUser(null);
    setShowPassword(false);
    setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'customer', isActive: true, customerGroup: 'retail' });
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'customer',
      isActive: user.isActive !== false,
      customerGroup: user.customerGroup || 'retail',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password) delete data.password;
    if (editUser) {
      updateMutation.mutate({ id: editUser._id, data });
    } else {
      if (!data.password) { toast.error('Password is required for new users'); return; }
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all users, admins, and customers</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          <IoAdd size={18} /> Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers || 0, icon: IoPeople, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: stats.totalActive || 0, icon: IoCheckmarkCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Inactive', value: stats.totalInactive || 0, icon: IoCloseCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Admins', value: stats.byRole?.admin || 0, icon: IoShieldCheckmark, color: 'text-purple-600 bg-purple-50' },
          { label: 'New (30d)', value: stats.recentSignups || 0, icon: IoPersonAdd, color: 'text-orange-600 bg-orange-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border-2 border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="shop_manager">Shop Manager</option>
            <option value="customer">Customer</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Orders</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
              ) : users.map(user => {
                const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.customer;
                return (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      {user.customRole && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-600">
                          {user.customRole.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleMutation.mutate(user._id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          user.isActive !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.orderCount || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                          <IoCreate size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs font-medium border-2 transition-colors ${p === page ? 'border-primary bg-primary text-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white w-full max-w-lg mx-4 border-2 border-gray-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><IoClose size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{editUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    {...(!editUser ? { required: true } : {})} minLength={6}
                    className="w-full px-3 py-2 pr-10 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary">
                    <option value="customer">Customer</option>
                    <option value="shop_manager">Shop Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Group</label>
                  <select value={form.customerGroup} onChange={e => setForm(f => ({ ...f, customerGroup: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary">
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="vip">VIP</option>
                    <option value="distributor">Distributor</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Account is active</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white w-full max-w-sm mx-4 border-2 border-gray-200 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteConfirm._id)} disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
