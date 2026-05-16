import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bundlesAPI, visualSearchAPI, productsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoAdd, IoTrash, IoSparkles } from 'react-icons/io5';

const BundlesPage = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: bundlesData } = useQuery('bundles-admin', () => bundlesAPI.list());
  const { data: statusData } = useQuery('embedding-status', () => visualSearchAPI.embeddingStatus());
  const { data: productsData } = useQuery(['products-bundle-picker'], () => productsAPI.getAll({ limit: 200 }), { enabled: !!editing });

  const bundles = bundlesData?.data?.data || [];
  const status = statusData?.data?.data || {};
  const products = productsData?.data?.data || [];

  const save = useMutation((b) => b._id ? bundlesAPI.update(b._id, b) : bundlesAPI.create(b), {
    onSuccess: () => { qc.invalidateQueries('bundles-admin'); toast.success('Saved'); setEditing(null); }
  });
  const remove = useMutation((id) => bundlesAPI.remove(id), {
    onSuccess: () => qc.invalidateQueries('bundles-admin')
  });
  const backfill = useMutation((opts) => visualSearchAPI.backfill(opts), {
    onSuccess: (res) => { toast.success(`Embedded ${res.data?.data?.updated} products`); qc.invalidateQueries('embedding-status'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Backfill failed')
  });

  const blank = { name: '', description: '', items: [], triggerProducts: [], triggerCategories: [], discountType: 'percent', discountValue: 10, displayPages: ['product_detail'], isActive: true };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Smart Bundles & Visual Search</h1>
        <p className="text-sm text-gray-500">Bundle complementary products, and power AI search by indexing product embeddings.</p>
      </div>

      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-2"><IoSparkles className="text-blue-500" /> AI Embeddings</h2>
            <span className="text-sm text-gray-500">{status.withEmbedding || 0} / {status.total || 0} products ({status.coverage || 0}%)</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded">
            <div className="h-full bg-blue-500 rounded" style={{ width: `${status.coverage || 0}%` }} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => backfill.mutate({ limit: 50 })} disabled={backfill.isLoading}>Embed next 50 products</Button>
            <button className="btn btn-ghost btn-sm" onClick={() => backfill.mutate({ limit: 50, force: true })}>Force re-embed</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Requires <code>openaiApiKey</code> in Settings or <code>OPENAI_API_KEY</code> env var. Uses <code>text-embedding-3-small</code>.</p>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Curated Bundles</h2>
        <Button onClick={() => setEditing(blank)}><IoAdd className="mr-1" /> New bundle</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Triggers</th><th>Items</th><th>Discount</th><th>Active</th><th>Stats</th><th></th></tr></thead>
            <tbody>
              {bundles.map(b => (
                <tr key={b._id}>
                  <td>{b.name}</td>
                  <td className="text-xs">{(b.triggerProducts || []).map(p => p.name).join(', ') || (b.triggerCategories || []).map(c => c.name).join(', ') || '—'}</td>
                  <td>{b.items?.length || 0}</td>
                  <td>{b.discountType === 'percent' ? `${b.discountValue}%` : `R ${b.discountValue}`}</td>
                  <td>{b.isActive ? 'Yes' : 'No'}</td>
                  <td className="text-xs">{b.stats?.impressions || 0} views · {b.stats?.addToCarts || 0} adds</td>
                  <td>
                    <button className="btn btn-xs btn-ghost" onClick={() => setEditing(b)}>Edit</button>
                    <button className="btn btn-xs btn-ghost text-rose-600" onClick={() => { if (confirm('Delete?')) remove.mutate(b._id); }}><IoTrash /></button>
                  </td>
                </tr>
              ))}
              {bundles.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">No bundles yet. AI will auto-suggest "Complete the look" when none exist.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-3 my-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing._id ? 'Edit' : 'New'} bundle</h3>
            <input className="input input-bordered w-full" placeholder="Bundle name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <textarea className="textarea textarea-bordered w-full" placeholder="Description (e.g. 'Complete the gym look')" rows={2} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className="select select-bordered" value={editing.discountType} onChange={e => setEditing({ ...editing, discountType: e.target.value })}>
                <option value="percent">% off</option>
                <option value="fixed">R off</option>
                <option value="price">Fixed bundle price</option>
              </select>
              <input type="number" className="input input-bordered" value={editing.discountValue} onChange={e => setEditing({ ...editing, discountValue: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Trigger when customer views these products</p>
              <select multiple size={4} className="select select-bordered w-full text-xs" value={editing.triggerProducts || []} onChange={e => setEditing({ ...editing, triggerProducts: Array.from(e.target.selectedOptions, o => o.value) })}>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">Bundle items</p>
              <select multiple size={4} className="select select-bordered w-full text-xs" value={(editing.items || []).map(i => i.product)} onChange={e => setEditing({ ...editing, items: Array.from(e.target.selectedOptions, o => ({ product: o.value, quantity: 1 })) })}>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} — R {(p.salePrice || p.price)?.toFixed(2)}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} /> Active
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

export default BundlesPage;
