import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, returnsAPI } from '../../services/api';

const REASONS = [
  { value: 'defective', label: 'Item is defective' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'damaged_shipping', label: 'Damaged in shipping' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'size_fit', label: 'Size / fit issue' },
  { value: 'other', label: 'Other' }
];

const RequestReturnPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('pesa_coins');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const orderRes = await ordersAPI.getOne(orderId);
        setOrder(orderRes.data.data);
        const eligRes = await returnsAPI.eligibility(orderId);
        setEligibility(eligRes.data.data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [orderId]);

  const toggleItem = (item) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[item._id]) delete next[item._id];
      else next[item._id] = { orderItem: item._id, product: item.product, name: item.name, quantity: item.quantity, unitPrice: item.salePrice || item.price };
      return next;
    });
  };

  const updateQty = (id, qty) => {
    setSelectedItems(prev => ({ ...prev, [id]: { ...prev[id], quantity: Math.max(1, qty) } }));
  };

  const submit = async () => {
    if (Object.keys(selectedItems).length === 0) return alert('Pick at least one item to return.');
    if (!reason.trim()) return alert('Please explain the reason for your return.');
    setSubmitting(true);
    try {
      await returnsAPI.create({
        orderId,
        items: Object.values(selectedItems),
        reason,
        reasonCategory,
        customerNotes: notes,
        refundMethod
      });
      navigate('/account/returns');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit return');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order || !eligibility) return <div className="p-6 max-w-3xl mx-auto">Loading...</div>;

  if (!eligibility.eligible) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Return not available</h1>
        <p className="text-gray-600">{eligibility.reason}</p>
        {eligibility.existingReturn && <p className="mt-3 text-sm">Existing RMA: <strong>{eligibility.existingReturn.rmaNumber}</strong></p>}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Request a return</h1>
      <p className="text-sm text-gray-500 mb-6">Order {order.orderNumber}</p>

      <div className="space-y-3 mb-6">
        <h2 className="font-semibold">Select items to return</h2>
        {order.items.map(item => (
          <label key={item._id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={!!selectedItems[item._id]} onChange={() => toggleItem(item)} />
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">Qty {item.quantity} · R {(item.salePrice || item.price).toFixed(2)} each</p>
            </div>
            {selectedItems[item._id] && (
              <input type="number" min={1} max={item.quantity} value={selectedItems[item._id].quantity} onChange={e => updateQty(item._id, parseInt(e.target.value) || 1)} className="w-16 border rounded p-1 text-sm" />
            )}
          </label>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Reason category</label>
          <select className="border rounded w-full p-2" value={reasonCategory} onChange={e => setReasonCategory(e.target.value)}>
            {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Tell us what happened</label>
          <textarea className="border rounded w-full p-2" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the issue..." />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Additional notes (optional)</label>
          <textarea className="border rounded w-full p-2" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Refund method</label>
          <select className="border rounded w-full p-2" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
            <option value="pesa_coins">PESA Coins — instant credit to your balance</option>
            <option value="original_payment">Original payment method (slower)</option>
            <option value="store_credit">Store credit</option>
          </select>
        </div>
      </div>

      <button onClick={submit} disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded font-semibold disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit return request'}
      </button>
    </div>
  );
};

export default RequestReturnPage;
