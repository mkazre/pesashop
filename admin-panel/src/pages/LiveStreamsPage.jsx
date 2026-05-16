import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { liveStreamsAPI, productsAPI } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoAdd, IoPlay, IoStop, IoTrash, IoRadio } from 'react-icons/io5';

const STATUS_STYLES = { scheduled: 'badge-info', live: 'badge-success', ended: 'badge-ghost', cancelled: 'badge-error' };

const LiveStreamsPage = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery('live-streams', () => liveStreamsAPI.adminList());
  const streams = data?.data?.data || [];

  const { data: productsData } = useQuery(['products-for-live', editing?._id], () => productsAPI.getAll({ limit: 200 }), { enabled: !!editing });
  const products = productsData?.data?.data || [];

  const save = useMutation((s) => s._id ? liveStreamsAPI.update(s._id, s) : liveStreamsAPI.create(s), {
    onSuccess: () => { qc.invalidateQueries('live-streams'); toast.success('Saved'); setEditing(null); }
  });
  const start = useMutation((id) => liveStreamsAPI.start(id), { onSuccess: () => { qc.invalidateQueries('live-streams'); toast.success('Stream started'); } });
  const end = useMutation((id) => liveStreamsAPI.end(id, {}), { onSuccess: () => { qc.invalidateQueries('live-streams'); toast.success('Stream ended'); } });
  const remove = useMutation((id) => liveStreamsAPI.remove(id), { onSuccess: () => qc.invalidateQueries('live-streams') });

  const blank = { title: '', description: '', source: 'hls', playbackUrl: '', scheduledStart: new Date().toISOString().slice(0, 16), products: [], isFeatured: false, liveDiscountPercent: 0 };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Live Shopping</h1>
          <p className="text-sm text-gray-500">Schedule streams, manage products, and pin items in real time.</p>
        </div>
        <Button onClick={() => setEditing(blank)}><IoAdd className="mr-1" /> New stream</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Title</th><th>Scheduled</th><th>Status</th><th>Products</th><th>Viewers</th><th>Cart adds</th><th></th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>}
              {!isLoading && streams.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-500">No streams yet.</td></tr>}
              {streams.map(s => (
                <tr key={s._id}>
                  <td>
                    <p className="font-medium">{s.title}</p>
                    {s.isFeatured && <span className="badge badge-warning badge-xs">Featured</span>}
                  </td>
                  <td className="text-xs">{new Date(s.scheduledStart).toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_STYLES[s.status]}`}>{s.status}</span></td>
                  <td>{s.products?.length || 0}</td>
                  <td>{s.stats?.totalViewers || 0}</td>
                  <td>{s.stats?.cartAdds || 0}</td>
                  <td>
                    <div className="flex gap-1">
                      {s.status === 'scheduled' && <button className="btn btn-xs btn-success" onClick={() => start.mutate(s._id)}><IoPlay /></button>}
                      {s.status === 'live' && <>
                        <button className="btn btn-xs btn-primary" onClick={() => navigate(`/live-streams/${s._id}/control`)}><IoRadio /></button>
                        <button className="btn btn-xs btn-error" onClick={() => end.mutate(s._id)}><IoStop /></button>
                      </>}
                      <button className="btn btn-xs btn-ghost" onClick={() => setEditing(s)}>Edit</button>
                      <button className="btn btn-xs btn-ghost text-rose-600" onClick={() => { if (confirm('Delete stream?')) remove.mutate(s._id); }}><IoTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-3 my-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing._id ? 'Edit' : 'New'} stream</h3>
            <input className="input input-bordered w-full" placeholder="Title" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <textarea className="textarea textarea-bordered w-full" placeholder="Description" rows={2} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="select select-bordered" value={editing.source} onChange={e => setEditing({ ...editing, source: e.target.value })}>
                <option value="hls">HLS (.m3u8)</option>
                <option value="youtube">YouTube Live</option>
                <option value="mux">Mux</option>
                <option value="cloudflare">Cloudflare Stream</option>
              </select>
              <input type="datetime-local" className="input input-bordered" value={editing.scheduledStart ? new Date(editing.scheduledStart).toISOString().slice(0,16) : ''} onChange={e => setEditing({ ...editing, scheduledStart: e.target.value })} />
            </div>
            <input className="input input-bordered w-full" placeholder="Playback URL (HLS .m3u8 or YouTube embed URL)" value={editing.playbackUrl || ''} onChange={e => setEditing({ ...editing, playbackUrl: e.target.value })} />
            <input className="input input-bordered w-full" placeholder="Poster image URL (optional)" value={editing.posterImage || ''} onChange={e => setEditing({ ...editing, posterImage: e.target.value })} />
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm">Live discount %</label>
              <input type="number" min={0} max={80} className="input input-bordered" value={editing.liveDiscountPercent || 0} onChange={e => setEditing({ ...editing, liveDiscountPercent: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Products to feature ({(editing.products || []).length})</p>
              <div className="max-h-48 overflow-y-auto border rounded p-2 text-sm space-y-1">
                {products.slice(0, 50).map(p => (
                  <label key={p._id} className="flex items-center gap-2">
                    <input type="checkbox" checked={(editing.products || []).includes(p._id)} onChange={e => {
                      const set = new Set(editing.products || []);
                      if (e.target.checked) set.add(p._id); else set.delete(p._id);
                      setEditing({ ...editing, products: Array.from(set) });
                    }} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isFeatured || false} onChange={e => setEditing({ ...editing, isFeatured: e.target.checked })} /> Feature on home page
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <Button onClick={() => save.mutate(editing)}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamsPage;
