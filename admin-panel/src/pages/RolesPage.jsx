import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  IoAdd, IoTrash, IoCreate, IoClose, IoShieldCheckmark,
  IoCheckmark, IoRemove, IoRefresh, IoPeople,
} from 'react-icons/io5';
import { rolesAPI } from '@/services/api';

const RESOURCE_LABELS = {
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  laybyes: 'Laybyes',
  loyalty: 'PESA Coins / Loyalty',
  coupons: 'Coupons',
  gift_cards: 'Gift Cards',
  reviews: 'Reviews',
  questions: 'Q&A',
  currencies: 'Currencies',
  notifications: 'Notifications',
  emails: 'Email Templates',
  pages: 'Pages & Menus',
  menus: 'Menu Builder',
  media: 'Media Library',
  settings: 'Settings',
  import_export: 'Import / Export',
  stats: 'Stats & Analytics',
  badges: 'Badges',
  users: 'Users',
  roles: 'Roles',
  code_snippets: 'Code Snippets',
};

const RESOURCE_GROUPS = [
  { label: 'Core', resources: ['dashboard', 'products', 'categories', 'orders', 'customers'] },
  { label: 'Finance', resources: ['laybyes', 'loyalty', 'coupons', 'gift_cards', 'currencies'] },
  { label: 'Content', resources: ['reviews', 'questions', 'notifications', 'emails', 'pages', 'menus', 'badges'] },
  { label: 'System', resources: ['media', 'settings', 'import_export', 'stats', 'users', 'roles', 'code_snippets'] },
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });

  const { data: roles, isLoading } = useQuery('roles', () => rolesAPI.getAll().then(r => r.data?.data || []), { staleTime: 30000 });

  const createMutation = useMutation(data => rolesAPI.create(data), {
    onSuccess: () => { toast.success('Role created'); queryClient.invalidateQueries('roles'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create role'),
  });

  const updateMutation = useMutation(({ id, data }) => rolesAPI.update(id, data), {
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries('roles'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update role'),
  });

  const deleteMutation = useMutation(id => rolesAPI.delete(id), {
    onSuccess: () => { toast.success('Role deleted'); queryClient.invalidateQueries('roles'); setDeleteConfirm(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete role'),
  });

  const seedMutation = useMutation(() => rolesAPI.seed(), {
    onSuccess: () => { toast.success('Default roles seeded'); queryClient.invalidateQueries('roles'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const allResources = Object.keys(RESOURCE_LABELS);

  const initPermissions = (existingPerms) => {
    return allResources.map(resource => {
      const existing = existingPerms?.find(p => p.resource === resource);
      return existing || { resource, create: false, read: false, update: false, delete: false };
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRole(null);
    setForm({ name: '', description: '', permissions: [] });
  };

  const openCreate = () => {
    setEditRole(null);
    setForm({ name: '', description: '', permissions: initPermissions([]) });
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: initPermissions(role.permissions),
    });
    setModalOpen(true);
  };

  const togglePerm = (resource, action) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.map(p =>
        p.resource === resource ? { ...p, [action]: !p[action] } : p
      ),
    }));
  };

  const toggleAllForResource = (resource) => {
    setForm(f => {
      const perm = f.permissions.find(p => p.resource === resource);
      const allOn = perm && ACTIONS.every(a => perm[a]);
      return {
        ...f,
        permissions: f.permissions.map(p =>
          p.resource === resource ? { ...p, create: !allOn, read: !allOn, update: !allOn, delete: !allOn } : p
        ),
      };
    });
  };

  const toggleAllForAction = (action) => {
    setForm(f => {
      const allOn = f.permissions.every(p => p[action]);
      return {
        ...f,
        permissions: f.permissions.map(p => ({ ...p, [action]: !allOn })),
      };
    });
  };

  const selectAll = () => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.map(p => ({ ...p, create: true, read: true, update: true, delete: true })),
    }));
  };

  const deselectAll = () => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.map(p => ({ ...p, create: false, read: false, update: false, delete: false })),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editRole) {
      updateMutation.mutate({ id: editRole._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getPermCount = (role) => {
    if (!role.permissions) return 0;
    return role.permissions.reduce((sum, p) => sum + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Define what each role can access and manage</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <IoRefresh size={16} /> Seed Defaults
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <IoAdd size={18} /> New Role
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading roles...</div>
      ) : !roles || roles.length === 0 ? (
        <div className="bg-white border-2 border-gray-200 p-12 text-center">
          <IoShieldCheckmark size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 mb-4">No roles defined yet</p>
          <button onClick={() => seedMutation.mutate()} className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-primary/90">
            Seed Default Roles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const permCount = getPermCount(role);
            const totalPerms = allResources.length * 4;
            const pct = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;
            return (
              <div key={role._id} className="bg-white border-2 border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.isSystem ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        <IoShieldCheckmark size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{role.name}</h3>
                        {role.isSystem && <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-500">System</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(role)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <IoCreate size={16} />
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => setDeleteConfirm(role)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <IoTrash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {role.description && <p className="text-xs text-gray-500 mt-2">{role.description}</p>}

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <IoPeople size={14} />
                      <span>{role.userCount || 0} users</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Permissions</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal — Full Screen Permissions Matrix */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white w-full max-w-4xl mx-4 border-2 border-gray-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{editRole ? `Edit Role: ${editRole.name}` : 'Create New Role'}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><IoClose size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      disabled={editRole?.isSystem}
                      className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick:</span>
                  <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Select All</button>
                  <button type="button" onClick={deselectAll} className="text-xs text-red-600 hover:text-red-800 font-medium">Deselect All</button>
                </div>

                {/* Permissions Matrix */}
                <div className="border-2 border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 w-1/3">Resource</th>
                        {ACTIONS.map(action => (
                          <th key={action} className="text-center px-4 py-3 font-semibold text-gray-600 w-1/6">
                            <button type="button" onClick={() => toggleAllForAction(action)}
                              className="hover:text-primary transition-colors capitalize">
                              {action}
                            </button>
                          </th>
                        ))}
                        <th className="text-center px-4 py-3 font-semibold text-gray-600 w-16">All</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RESOURCE_GROUPS.map(group => (
                        <React.Fragment key={group.label}>
                          <tr className="bg-gray-50/50">
                            <td colSpan={6} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{group.label}</td>
                          </tr>
                          {group.resources.map(resource => {
                            const perm = form.permissions.find(p => p.resource === resource);
                            if (!perm) return null;
                            const allOn = ACTIONS.every(a => perm[a]);
                            return (
                              <tr key={resource} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-gray-700">{RESOURCE_LABELS[resource] || resource}</td>
                                {ACTIONS.map(action => (
                                  <td key={action} className="text-center px-4 py-2.5">
                                    <button type="button" onClick={() => togglePerm(resource, action)}
                                      className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                        perm[action]
                                          ? 'bg-primary text-white shadow-sm'
                                          : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400'
                                      }`}>
                                      {perm[action] ? <IoCheckmark size={16} /> : <IoRemove size={14} />}
                                    </button>
                                  </td>
                                ))}
                                <td className="text-center px-4 py-2.5">
                                  <button type="button" onClick={() => toggleAllForResource(resource)}
                                    className={`w-7 h-7 rounded flex items-center justify-center mx-auto transition-all ${
                                      allOn ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                    }`}>
                                    <IoCheckmark size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t-2 border-gray-200 flex-shrink-0 bg-gray-50">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
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
            <h3 className="text-lg font-bold text-gray-900">Delete Role</h3>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? Users assigned this role will lose their custom permissions.
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
