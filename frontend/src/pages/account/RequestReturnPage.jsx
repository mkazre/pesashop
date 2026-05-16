import React, { useState, useEffect, useRef } from 'react';
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
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const invoiceRef = useRef(null);
  const photosRef = useRef(null);

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
    if (!invoiceFile) return alert('Proof of purchase (invoice) is required. We only process returns for purchases we can verify.');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('reason', reason);
      formData.append('reasonCategory', reasonCategory);
      formData.append('customerNotes', notes);
      formData.append('refundMethod', refundMethod);
      formData.append('items', JSON.stringify(Object.values(selectedItems)));
      formData.append('invoice', invoiceFile);
      photoFiles.forEach(f => formData.append('photos', f));
      await returnsAPI.create(formData);
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

        {/* Mandatory invoice */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Proof of purchase / invoice <span className="text-red-600">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Required. PDF or image. We only process returns we can verify.</p>
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => invoiceRef.current?.click()}>
            <input
              ref={invoiceRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
            />
            {invoiceFile ? (
              <p className="text-sm text-gray-700"><strong>{invoiceFile.name}</strong> · {(invoiceFile.size / 1024).toFixed(0)} KB · <span className="text-blue-600">click to change</span></p>
            ) : (
              <p className="text-sm text-gray-500">📄 Click to upload your invoice</p>
            )}
          </div>
        </div>

        {/* Optional photos */}
        <div>
          <label className="block text-sm font-semibold mb-1">Photos of the item (optional, up to 5)</label>
          <p className="text-xs text-gray-500 mb-2">Helpful for "defective" or "damaged in shipping" claims.</p>
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => photosRef.current?.click()}>
            <input
              ref={photosRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={e => setPhotoFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
            {photoFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {photoFiles.map((f, i) => (
                  <div key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{f.name.slice(0, 20)}</div>
                ))}
                <p className="w-full text-xs text-blue-600 mt-2">Click to change selection</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">📸 Click to add photos (or use camera)</p>
            )}
          </div>
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
