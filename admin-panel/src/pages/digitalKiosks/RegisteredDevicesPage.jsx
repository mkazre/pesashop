import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { digitalKioskAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoHardwareChipOutline, IoPencilOutline, IoTrashOutline, IoSaveOutline, IoCloseOutline } from 'react-icons/io5';

function isOnline(lastHeartbeat) {
  if (!lastHeartbeat) return false;
  return (Date.now() - new Date(lastHeartbeat).getTime()) < 3 * 60 * 1000;
}

function formatRelative(date) {
  if (!date) return 'never';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RegisteredDevicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', location: '', overrides: '{}' });

  const { data, isLoading } = useQuery('digital-kiosk-config', digitalKioskAPI.getConfig, {
    refetchOnWindowFocus: 'always',
    refetchInterval: 60_000,
  });
  const devices = data?.data?.data?.devices || [];

  const saveMutation = useMutation(
    ({ deviceId, payload }) => digitalKioskAPI.updateDevice(deviceId, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('digital-kiosk-config');
        toast.success('Device updated');
        setEditing(null);
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
    }
  );

  const deleteMutation = useMutation(
    (deviceId) => digitalKioskAPI.deleteDevice(deviceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('digital-kiosk-config');
        toast.success('Device removed');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
    }
  );

  const startEdit = (d) => {
    setEditing(d.deviceId);
    setEditForm({
      name: d.name || '',
      location: d.location || '',
      overrides: JSON.stringify(d.overrides || {}, null, 2),
    });
  };

  const saveEdit = (deviceId) => {
    let overrides = {};
    try {
      overrides = editForm.overrides.trim() ? JSON.parse(editForm.overrides) : {};
    } catch (err) {
      toast.error('Overrides must be valid JSON');
      return;
    }
    saveMutation.mutate({ deviceId, payload: { name: editForm.name, location: editForm.location, overrides } });
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <IoHardwareChipOutline size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Registered Kiosk Devices</h1>
            <p className="text-sm text-gray-500">Each device self-registers when it first loads <code>/kiosk?kiosk=&lt;id&gt;</code></p>
          </div>
        </div>
        <div className="text-sm text-gray-500">{devices.length} device{devices.length === 1 ? '' : 's'}</div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Device ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Screen</th>
                <th className="px-4 py-3">Last Heartbeat</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No devices registered yet. Open <code>/kiosk?kiosk=test-1</code> on a kiosk to register.
                </td></tr>
              )}
              {devices.map((d) => {
                const online = isOnline(d.lastHeartbeat);
                const isEditing = editing === d.deviceId;
                return (
                  <React.Fragment key={d.deviceId}>
                    <tr>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${online ? 'text-green-700' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.deviceId}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{d.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{d.location || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{d.screenWidth ? `${d.screenWidth}×${d.screenHeight}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatRelative(d.lastHeartbeat)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => isEditing ? setEditing(null) : startEdit(d)} className="p-2 rounded hover:bg-gray-100">
                          {isEditing ? <IoCloseOutline /> : <IoPencilOutline />}
                        </button>
                        <button
                          onClick={() => window.confirm(`Delete kiosk "${d.name || d.deviceId}"?`) && deleteMutation.mutate(d.deviceId)}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                        >
                          <IoTrashOutline />
                        </button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs font-medium text-gray-700">Name</label>
                              <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2 text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Location</label>
                              <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="mt-1 w-full border rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-3">
                              <label className="text-xs font-medium text-gray-700">Overrides (JSON)</label>
                              <textarea
                                value={editForm.overrides}
                                onChange={(e) => setEditForm({ ...editForm, overrides: e.target.value })}
                                rows={5}
                                className="mt-1 w-full border rounded px-3 py-2 text-xs font-mono"
                                placeholder='{ "welcomeHeading": "Welcome to our V&A store" }'
                              />
                              <p className="text-xs text-gray-500 mt-1">Override any top-level config field for this device (welcomeHeading, branding, featuredCategories, etc.)</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button onClick={() => saveEdit(d.deviceId)} disabled={saveMutation.isLoading}>
                              <IoSaveOutline size={16} className="mr-2" />Save
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
