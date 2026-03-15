import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import toast from 'react-hot-toast';
import {
  IoAdd, IoTrash, IoSend, IoPencil, IoEye, IoCopy, IoClose,
  IoNotifications, IoMegaphone, IoCart, IoPricetag, IoTime,
  IoStatsChart, IoCheckmarkCircle, IoAlertCircle, IoCalendar,
  IoImage, IoLink, IoPeople, IoGlobe, IoPhonePortrait,
} from 'react-icons/io5';

const NOTIFICATION_TYPES = [
  { value: 'promotion', label: 'Promotion', icon: IoPricetag, color: 'text-orange-500' },
  { value: 'product', label: 'Product', icon: IoCart, color: 'text-blue-500' },
  { value: 'order_update', label: 'Order Update', icon: IoCheckmarkCircle, color: 'text-green-500' },
  { value: 'announcement', label: 'Announcement', icon: IoMegaphone, color: 'text-purple-500' },
  { value: 'coupon', label: 'Coupon', icon: IoPricetag, color: 'text-pink-500' },
  { value: 'reminder', label: 'Reminder', icon: IoTime, color: 'text-yellow-500' },
  { value: 'custom', label: 'Custom', icon: IoNotifications, color: 'text-gray-500' },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
};

const EMPTY_NOTIFICATION = {
  title: '',
  body: '',
  image: '',
  icon: '',
  type: 'promotion',
  actionUrl: '',
  actionLabel: '',
  secondaryActionUrl: '',
  secondaryActionLabel: '',
  targetAudience: 'all',
  targetUsers: [],
  targetSegment: {},
  channels: { inApp: true, webPush: true, mobilePush: true },
  scheduledAt: '',
  expiresAt: '',
  priority: 'normal',
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState(null); // null | 'new' | notification object
  const [previewModal, setPreviewModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form state
  const [form, setForm] = useState({ ...EMPTY_NOTIFICATION });

  // Queries
  const { data: listData, isLoading } = useQuery(
    ['notifications', { page, status: statusFilter, type: typeFilter, search }],
    () => notificationsAPI.getAll({ page, limit: 15, status: statusFilter, type: typeFilter, search }),
    { keepPreviousData: true }
  );

  const notifications = listData?.data?.data || [];
  const pagination = listData?.data?.pagination || {};

  // Mutations
  const createMutation = useMutation(
    (data) => notificationsAPI.create(data),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Notification created'); setEditModal(null); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => notificationsAPI.update(id, data),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Notification updated'); setEditModal(null); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
    }
  );

  const deleteMutation = useMutation(
    (id) => notificationsAPI.delete(id),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Deleted'); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
    }
  );

  const sendMutation = useMutation(
    (id) => notificationsAPI.send(id),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Notification sent!'); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to send'),
    }
  );

  const duplicateMutation = useMutation(
    (id) => notificationsAPI.duplicate(id),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Duplicated'); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to duplicate'),
    }
  );

  const cancelMutation = useMutation(
    (id) => notificationsAPI.cancel(id),
    {
      onSuccess: () => { queryClient.invalidateQueries('notifications'); toast.success('Cancelled'); },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel'),
    }
  );

  // Handlers
  const openNew = () => {
    setForm({ ...EMPTY_NOTIFICATION });
    setEditModal('new');
  };

  const openEdit = (n) => {
    setForm({
      title: n.title || '',
      body: n.body || '',
      image: n.image || '',
      icon: n.icon || '',
      type: n.type || 'custom',
      actionUrl: n.actionUrl || '',
      actionLabel: n.actionLabel || '',
      secondaryActionUrl: n.secondaryActionUrl || '',
      secondaryActionLabel: n.secondaryActionLabel || '',
      targetAudience: n.targetAudience || 'all',
      targetUsers: n.targetUsers || [],
      targetSegment: n.targetSegment || {},
      channels: n.channels || { inApp: true, webPush: true, mobilePush: true },
      scheduledAt: n.scheduledAt ? new Date(n.scheduledAt).toISOString().slice(0, 16) : '',
      expiresAt: n.expiresAt ? new Date(n.expiresAt).toISOString().slice(0, 16) : '',
      priority: n.priority || 'normal',
    });
    setEditModal(n);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    const payload = {
      ...form,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    if (editModal === 'new') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editModal._id, data: payload });
    }
  };

  const handleSendNow = (id) => {
    if (confirm('Send this notification to all targeted users now?')) {
      sendMutation.mutate(id);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Delete this notification permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeInfo = (type) => NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[6];

  if (isLoading) {
    return <div className="p-6"><div className="animate-pulse h-8 w-48 bg-gray-200 rounded mb-4" /><div className="animate-pulse h-64 bg-gray-100 rounded" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Send push notifications to web & mobile users</p>
        </div>
        <Button onClick={openNew}>
          <IoAdd size={18} className="mr-1" /> Create Notification
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or body..."
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="input input-bordered h-10 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="input input-bordered h-10 text-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {NOTIFICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications Table */}
      <Card>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <IoNotifications size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications yet</p>
            <Button onClick={openNew} variant="secondary" className="mt-3">
              <IoAdd size={16} className="mr-1" /> Create your first notification
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-gray-500">
                    <th>Notification</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Channels</th>
                    <th>Status</th>
                    <th>Stats</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(n => {
                    const typeInfo = getTypeInfo(n.type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <tr key={n._id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-3 max-w-xs">
                            {n.image ? (
                              <img src={n.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <TypeIcon className={typeInfo.color} size={20} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{n.title}</p>
                              <p className="text-xs text-gray-400 truncate">{n.body}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                        </td>
                        <td>
                          <span className="text-xs capitalize">{n.targetAudience}</span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {n.channels?.inApp && <IoNotifications size={14} className="text-blue-400" title="In-App" />}
                            {n.channels?.webPush && <IoGlobe size={14} className="text-green-400" title="Web Push" />}
                            {n.channels?.mobilePush && <IoPhonePortrait size={14} className="text-purple-400" title="Mobile Push" />}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[n.status] || 'bg-gray-100'}`}>
                            {n.status}
                          </span>
                        </td>
                        <td>
                          {n.status === 'sent' ? (
                            <div className="text-xs text-gray-500">
                              <span title="Targeted">{n.stats?.targeted || 0} targeted</span>
                              {n.stats?.clicked > 0 && <span className="ml-1 text-green-600">• {n.stats.clicked} clicks</span>}
                            </div>
                          ) : n.scheduledAt ? (
                            <div className="text-xs text-blue-500">
                              <IoCalendar size={12} className="inline mr-1" />
                              {new Date(n.scheduledAt).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setPreviewModal(n)} className="btn btn-ghost btn-xs" title="Preview">
                              <IoEye size={14} />
                            </button>
                            {(n.status === 'draft' || n.status === 'scheduled') && (
                              <>
                                <button onClick={() => openEdit(n)} className="btn btn-ghost btn-xs" title="Edit">
                                  <IoPencil size={14} />
                                </button>
                                <button onClick={() => handleSendNow(n._id)} className="btn btn-ghost btn-xs text-green-600" title="Send Now">
                                  <IoSend size={14} />
                                </button>
                              </>
                            )}
                            {n.status === 'scheduled' && (
                              <button onClick={() => cancelMutation.mutate(n._id)} className="btn btn-ghost btn-xs text-orange-500" title="Cancel">
                                <IoClose size={14} />
                              </button>
                            )}
                            <button onClick={() => duplicateMutation.mutate(n._id)} className="btn btn-ghost btn-xs" title="Duplicate">
                              <IoCopy size={14} />
                            </button>
                            <button onClick={() => handleDelete(n._id)} className="btn btn-ghost btn-xs text-red-500" title="Delete">
                              <IoTrash size={14} />
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
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
                <button className="btn btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ─── Create/Edit Modal ─── */}
      {editModal !== null && (
        <Modal
          isOpen={true}
          onClose={() => setEditModal(null)}
          title={editModal === 'new' ? 'Create Notification' : 'Edit Notification'}
          size="lg"
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Notification Type</label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${
                        form.type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={14} className={t.color} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Title *"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Flash Sale — 50% Off Everything!"
                maxLength={200}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium mb-1">Body *</label>
                <textarea
                  className="textarea textarea-bordered w-full h-24 text-sm"
                  value={form.body}
                  onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="All electronics are half price this weekend only. Don't miss out!"
                  maxLength={1000}
                />
                <span className="text-xs text-gray-400">{form.body.length}/1000</span>
              </div>
            </div>

            {/* Rich Media */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><IoImage size={16} /> Rich Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Hero Image URL"
                  value={form.image}
                  onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://example.com/sale-banner.jpg"
                  fullWidth
                />
                <Input
                  label="Small Icon URL"
                  value={form.icon}
                  onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  fullWidth
                />
              </div>
              {form.image && (
                <div className="mt-2 rounded-lg overflow-hidden border bg-gray-50 max-w-sm">
                  <img src={form.image} alt="Preview" className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Action Links */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><IoLink size={16} /> Action Links (Deep Linking)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Primary Action URL"
                  value={form.actionUrl}
                  onChange={(e) => setForm(f => ({ ...f, actionUrl: e.target.value }))}
                  placeholder="/product/nike-air-max or /shop?category=electronics"
                  fullWidth
                />
                <Input
                  label="Primary Button Text"
                  value={form.actionLabel}
                  onChange={(e) => setForm(f => ({ ...f, actionLabel: e.target.value }))}
                  placeholder="Shop Now"
                  fullWidth
                />
                <Input
                  label="Secondary Action URL"
                  value={form.secondaryActionUrl}
                  onChange={(e) => setForm(f => ({ ...f, secondaryActionUrl: e.target.value }))}
                  placeholder="/shop"
                  fullWidth
                />
                <Input
                  label="Secondary Button Text"
                  value={form.secondaryActionLabel}
                  onChange={(e) => setForm(f => ({ ...f, secondaryActionLabel: e.target.value }))}
                  placeholder="Browse All"
                  fullWidth
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">URLs can be relative paths (e.g. /product/slug) or full URLs. Users will navigate there when they tap the notification.</p>
            </div>

            {/* Targeting */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><IoPeople size={16} /> Audience</h3>
              <div className="flex gap-3">
                {[
                  { val: 'all', label: 'All Users', desc: 'Send to everyone' },
                  { val: 'segment', label: 'Segment', desc: 'Filter by criteria' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, targetAudience: opt.val }))}
                    className={`flex-1 p-3 rounded-lg border text-left transition ${
                      form.targetAudience === opt.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {form.targetAudience === 'segment' && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Customer Group"
                      value={form.targetSegment.customerGroup || ''}
                      onChange={(e) => setForm(f => ({ ...f, targetSegment: { ...f.targetSegment, customerGroup: e.target.value } }))}
                      placeholder="wholesale, retail..."
                      fullWidth
                    />
                    <Input
                      label="Min Orders"
                      type="number"
                      value={form.targetSegment.minOrderCount || ''}
                      onChange={(e) => setForm(f => ({ ...f, targetSegment: { ...f.targetSegment, minOrderCount: parseInt(e.target.value) || undefined } }))}
                      placeholder="0"
                      fullWidth
                    />
                    <Input
                      label="Min Total Spent (R)"
                      type="number"
                      value={form.targetSegment.minTotalSpent || ''}
                      onChange={(e) => setForm(f => ({ ...f, targetSegment: { ...f.targetSegment, minTotalSpent: parseFloat(e.target.value) || undefined } }))}
                      placeholder="0"
                      fullWidth
                    />
                    <div>
                      <label className="block text-sm font-medium mb-1">Has Active Laybye</label>
                      <select
                        className="input input-bordered h-10 w-full text-sm"
                        value={form.targetSegment.hasLaybye === undefined ? '' : String(form.targetSegment.hasLaybye)}
                        onChange={(e) => setForm(f => ({ ...f, targetSegment: { ...f.targetSegment, hasLaybye: e.target.value === '' ? undefined : e.target.value === 'true' } }))}
                      >
                        <option value="">Any</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Channels */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Delivery Channels</h3>
              <div className="flex gap-4">
                {[
                  { key: 'inApp', label: 'In-App Bell', icon: IoNotifications, color: 'text-blue-500' },
                  { key: 'webPush', label: 'Web Push', icon: IoGlobe, color: 'text-green-500' },
                  { key: 'mobilePush', label: 'Mobile Push', icon: IoPhonePortrait, color: 'text-purple-500' },
                ].map(ch => {
                  const ChIcon = ch.icon;
                  return (
                    <label key={ch.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={form.channels[ch.key] || false}
                        onChange={(e) => setForm(f => ({ ...f, channels: { ...f.channels, [ch.key]: e.target.checked } }))}
                      />
                      <ChIcon size={16} className={ch.color} />
                      <span className="text-sm">{ch.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Schedule Send</label>
                <input
                  type="datetime-local"
                  className="input input-bordered h-10 w-full text-sm"
                  value={form.scheduledAt}
                  onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">Leave empty to send manually</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  className="input input-bordered h-10 w-full text-sm"
                  value={form.expiresAt}
                  onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-0.5">When to hide from bell</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="input input-bordered h-10 w-full text-sm"
                  value={form.priority}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="ghost" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isLoading || updateMutation.isLoading}
            >
              {editModal === 'new' ? (form.scheduledAt ? 'Schedule' : 'Save as Draft') : 'Update'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ─── Preview Modal ─── */}
      {previewModal && (
        <Modal isOpen={true} onClose={() => setPreviewModal(null)} title="Notification Preview" size="md">
          <div className="space-y-4">
            {/* Mobile Push Preview */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Push Notification Preview</p>
              <div className="bg-gray-900 text-white rounded-2xl p-4 max-w-sm mx-auto shadow-lg">
                <div className="flex items-start gap-3">
                  {previewModal.icon ? (
                    <img src={previewModal.icon} alt="" className="w-8 h-8 rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-green-700 flex items-center justify-center text-xs font-bold">P</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">PesaShop • now</p>
                    <p className="font-semibold text-sm mt-0.5">{previewModal.title}</p>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">{previewModal.body}</p>
                  </div>
                </div>
                {previewModal.image && (
                  <img src={previewModal.image} alt="" className="w-full h-36 object-cover rounded-lg mt-3" />
                )}
                {previewModal.actionLabel && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                    <button className="flex-1 text-center text-xs font-medium text-blue-400 py-1">{previewModal.actionLabel}</button>
                    {previewModal.secondaryActionLabel && (
                      <button className="flex-1 text-center text-xs font-medium text-gray-400 py-1">{previewModal.secondaryActionLabel}</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* In-App Bell Preview */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">In-App Bell Preview</p>
              <div className="border rounded-lg p-3 max-w-sm mx-auto bg-white">
                <div className="flex items-start gap-3">
                  {previewModal.image ? (
                    <img src={previewModal.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {(() => { const T = getTypeInfo(previewModal.type).icon; return <T size={18} className={getTypeInfo(previewModal.type).color} />; })()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{previewModal.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{previewModal.body}</p>
                    <p className="text-xs text-gray-400 mt-1">Just now</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="text-xs text-gray-500 space-y-1 pt-3 border-t">
              <p><strong>Type:</strong> {getTypeInfo(previewModal.type).label}</p>
              <p><strong>Audience:</strong> {previewModal.targetAudience}</p>
              <p><strong>Channels:</strong> {[previewModal.channels?.inApp && 'In-App', previewModal.channels?.webPush && 'Web Push', previewModal.channels?.mobilePush && 'Mobile Push'].filter(Boolean).join(', ')}</p>
              {previewModal.actionUrl && <p><strong>Action URL:</strong> {previewModal.actionUrl}</p>}
              {previewModal.status === 'sent' && (
                <p><strong>Sent:</strong> {new Date(previewModal.sentAt).toLocaleString()} — {previewModal.stats?.targeted || 0} targeted, {previewModal.stats?.clicked || 0} clicks</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => setPreviewModal(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationsPage;
