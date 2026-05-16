import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { returnsAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { IoCheckmark, IoClose, IoCash, IoArchive, IoRefresh, IoEye } from 'react-icons/io5';

const STATUS_STYLES = {
  requested: 'badge-warning',
  approved: 'badge-info',
  awaiting_shipment: 'badge-info',
  received: 'badge-info',
  refunded: 'badge-success',
  rejected: 'badge-error',
  closed: 'badge-ghost',
  disputed: 'badge-error'
};

const REASON_LABELS = {
  defective: 'Defective',
  wrong_item: 'Wrong item',
  not_as_described: 'Not as described',
  damaged_shipping: 'Damaged in shipping',
  changed_mind: 'Changed mind',
  size_fit: 'Size / fit',
  other: 'Other'
};

const ReturnsPage = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: '', reasonCategory: '' });
  const [selected, setSelected] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('pesa_coins');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery(['returns-admin', filter], () => returnsAPI.adminList(filter));
  const { data: statsData } = useQuery('returns-stats', () => returnsAPI.adminStats());
  const returns = data?.data?.data || [];
  const stats = statsData?.data?.data || {};

  const approve = useMutation((id) => returnsAPI.approve(id), {
    onSuccess: () => { qc.invalidateQueries('returns-admin'); toast.success('Return approved'); }
  });
  const reject = useMutation(({ id, reason }) => returnsAPI.reject(id, { reason }), {
    onSuccess: () => { qc.invalidateQueries('returns-admin'); toast.success('Return rejected'); setRejectReason(''); }
  });
  const markReceived = useMutation((id) => returnsAPI.markReceived(id), {
    onSuccess: () => { qc.invalidateQueries('returns-admin'); toast.success('Marked as received'); }
  });
  const refund = useMutation(({ id, refundMethod, refundAmount }) => returnsAPI.refund(id, { refundMethod, refundAmount }), {
    onSuccess: () => { qc.invalidateQueries('returns-admin'); toast.success('Refund issued'); setSelected(null); }
  });
  const closeMut = useMutation((id) => returnsAPI.close(id), {
    onSuccess: () => { qc.invalidateQueries('returns-admin'); toast.success('Return closed'); }
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Returns & Refunds</h1>
        <p className="text-sm text-gray-500">Approve, reject and refund customer returns.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Returns', value: returns.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Action', value: returns.filter(r => ['requested', 'disputed'].includes(r.status)).length, color: 'bg-amber-50 text-amber-600' },
          { label: 'Total Refunded', value: `R ${(stats.totalRefunded || 0).toFixed(2)}`, color: 'bg-green-50 text-green-600' },
          { label: 'Rejected', value: returns.filter(r => r.status === 'rejected').length, color: 'bg-rose-50 text-rose-600' }
        ].map((s, i) => (
          <Card key={i}><div className="p-4"><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div></Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className="select select-bordered select-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="select select-bordered select-sm" value={filter.reasonCategory} onChange={e => setFilter(f => ({ ...f, reasonCategory: e.target.value }))}>
          <option value="">All reasons</option>
          {Object.keys(REASON_LABELS).map(r => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>RMA</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Loading...</td></tr>}
              {!isLoading && returns.length === 0 && <tr><td colSpan={8} className="text-center text-gray-500 py-8">No returns yet.</td></tr>}
              {returns.map(r => (
                <tr key={r._id}>
                  <td className="font-mono text-xs">{r.rmaNumber}</td>
                  <td>{r.customer?.firstName} {r.customer?.lastName}<br/><span className="text-xs text-gray-500">{r.customer?.email}</span></td>
                  <td>{r.order?.orderNumber}</td>
                  <td>{REASON_LABELS[r.reasonCategory]}</td>
                  <td>R {r.refundAmount?.toFixed(2)}</td>
                  <td><span className={`badge ${STATUS_STYLES[r.status] || 'badge-ghost'}`}>{r.status.replace('_', ' ')}</span></td>
                  <td className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-xs btn-ghost" title="Details" onClick={() => { setSelected(r); setRefundAmount(r.refundAmount); setRefundMethod(r.refundMethod); }}><IoEye /></button>
                      {['requested', 'disputed'].includes(r.status) && (
                        <>
                          <button className="btn btn-xs btn-success" title="Approve" onClick={() => approve.mutate(r._id)}><IoCheckmark /></button>
                          <button className="btn btn-xs btn-error" title="Reject" onClick={() => { const reason = prompt('Reason for rejection:'); if (reason) reject.mutate({ id: r._id, reason }); }}><IoClose /></button>
                        </>
                      )}
                      {['approved', 'awaiting_shipment'].includes(r.status) && (
                        <button className="btn btn-xs btn-info" title="Mark received" onClick={() => markReceived.mutate(r._id)}><IoArchive /></button>
                      )}
                      {['received', 'approved', 'awaiting_shipment'].includes(r.status) && (
                        <button className="btn btn-xs btn-primary" title="Refund" onClick={() => { setSelected(r); setRefundAmount(r.refundAmount); setRefundMethod(r.refundMethod); }}><IoCash /></button>
                      )}
                      {r.status === 'refunded' && (
                        <button className="btn btn-xs btn-ghost" title="Close" onClick={() => closeMut.mutate(r._id)}><IoRefresh /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Return {selected.rmaNumber}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setSelected(null)}><IoClose /></button>
            </div>
            <p className="text-sm"><strong>Customer reason:</strong> {selected.reason}</p>
            {selected.customerNotes && <p className="text-sm text-gray-600"><strong>Notes:</strong> {selected.customerNotes}</p>}

            {/* Mandatory invoice */}
            {selected.invoiceUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm font-semibold text-amber-900 mb-2">📄 Proof of purchase</p>
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selected.invoiceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline"
                  >
                    View invoice
                  </a>
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selected.invoiceUrl}`}
                    download
                    className="btn btn-sm btn-outline"
                  >
                    Download
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-1 break-all">{selected.invoiceUrl.split('/').pop()}</p>
              </div>
            )}

            {/* Customer photos */}
            {selected.photos?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">📸 Customer photos ({selected.photos.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {selected.photos.map((p, i) => {
                    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${p}`;
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square border rounded overflow-hidden hover:opacity-80">
                        <img src={url} alt={`Return photo ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Items</p>
              <ul className="text-sm">
                {selected.items.map((it, i) => (
                  <li key={i} className="flex justify-between border-b py-1">
                    <span>{it.quantity}× {it.name}</span>
                    <span>R {it.total?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {['received', 'approved', 'awaiting_shipment'].includes(selected.status) && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold">Issue refund</p>
                <select className="select select-bordered select-sm w-full" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                  <option value="pesa_coins">PESA Coins (instant)</option>
                  <option value="original_payment">Original payment (manual provider reversal)</option>
                  <option value="store_credit">Store credit</option>
                </select>
                <input type="number" className="input input-bordered input-sm w-full" value={refundAmount} onChange={e => setRefundAmount(parseFloat(e.target.value))} />
                <Button onClick={() => refund.mutate({ id: selected._id, refundMethod, refundAmount })}>Issue Refund</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
