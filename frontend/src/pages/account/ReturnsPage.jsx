import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { returnsAPI } from '../../services/api';

const STATUS_LABELS = {
  requested: { label: 'Requested', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  awaiting_shipment: { label: 'Awaiting shipment', color: 'bg-blue-100 text-blue-700' },
  received: { label: 'Received', color: 'bg-indigo-100 text-indigo-700' },
  refunded: { label: 'Refunded', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
  disputed: { label: 'Disputed', color: 'bg-rose-100 text-rose-700' }
};

const ReturnsPage = () => {
  const { data, isLoading } = useQuery('my-returns', () => returnsAPI.getMine());
  const returns = data?.data?.data || [];
  const [showDispute, setShowDispute] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const handleDispute = async (id) => {
    try {
      await returnsAPI.dispute(id, disputeReason);
      window.location.reload();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to open dispute');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Returns</h1>
          <p className="text-sm text-gray-500">Track return requests and refunds.</p>
        </div>
        <Link to="/account/orders" className="text-sm text-blue-600 hover:underline">Start a return from your orders →</Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {!isLoading && returns.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-500">
          No returns yet. To start one, open an order from <Link to="/account/orders" className="text-blue-600 hover:underline">your orders</Link>.
        </div>
      )}

      <div className="space-y-4">
        {returns.map(r => {
          const status = STATUS_LABELS[r.status] || { label: r.status, color: 'bg-gray-100' };
          return (
            <div key={r._id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">RMA {r.rmaNumber}</p>
                  <p className="text-xs text-gray-500">Order {r.order?.orderNumber} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm mb-2"><strong>Reason:</strong> {r.reason}</p>
              <ul className="text-sm text-gray-600 mb-3">
                {r.items.map((it, i) => <li key={i}>· {it.quantity}× {it.name} — R {it.total?.toFixed(2)}</li>)}
              </ul>
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span><strong>Refund:</strong> R {r.refundAmount?.toFixed(2)} ({r.refundMethod?.replace('_', ' ')})</span>
                {r.refundedAt && <span className="text-green-600">Refunded {new Date(r.refundedAt).toLocaleDateString()}</span>}
              </div>
              {r.status === 'rejected' && r.rejectionReason && (
                <div className="mt-3 p-3 bg-rose-50 text-rose-700 text-sm rounded">
                  <strong>Rejection reason:</strong> {r.rejectionReason}
                  <button className="ml-3 underline" onClick={() => setShowDispute(r._id)}>Dispute this</button>
                </div>
              )}
              {showDispute === r._id && (
                <div className="mt-3 space-y-2">
                  <textarea className="border rounded w-full p-2 text-sm" rows={3} placeholder="Why are you disputing this rejection?" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded" onClick={() => handleDispute(r._id)}>Submit dispute</button>
                    <button className="px-3 py-1 text-sm" onClick={() => setShowDispute(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReturnsPage;
