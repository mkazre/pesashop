import React from 'react';
import { useQuery } from 'react-query';
import { invoicesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const InvoicesPage = () => {
  const { data, isLoading } = useQuery('my-invoices', () => invoicesAPI.getMine());
  const invoices = data?.data?.data || [];

  const handleDownload = async (orderId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/invoices/order/${orderId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download invoice');
    }
  };

  const handleView = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/invoices/order/${orderId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      toast.error('Failed to open invoice');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-1">My Invoices</h1>
      <p className="text-sm text-gray-500 mb-6">Download or view tax invoices for every order.</p>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {!isLoading && invoices.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center text-gray-500">No invoices yet.</div>
      )}

      <div className="space-y-3">
        {invoices.map(inv => (
          <div key={inv.orderId} className="border rounded-lg p-4 bg-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{inv.invoiceNumber}</p>
              <p className="text-xs text-gray-500">Order {inv.orderNumber} · {new Date(inv.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700">R {(inv.total || 0).toFixed(2)}</span>
              <span className={`text-xs px-2 py-1 rounded ${inv.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {inv.paymentStatus || 'pending'}
              </span>
              <button onClick={() => handleView(inv.orderId)} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">View</button>
              <button onClick={() => handleDownload(inv.orderId, inv.invoiceNumber)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoicesPage;
