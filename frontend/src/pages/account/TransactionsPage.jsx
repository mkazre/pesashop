import { useState } from 'react';
import { useQuery } from 'react-query';
import { laybyAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';

export default function TransactionsPage() {
  const { formatPrice } = useCurrencyStore();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(
    ['myTransactions', page],
    () => laybyAPI.getMyTransactions({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  const transactions = data?.data?.data || [];
  const totalPages = data?.data?.pages || 1;

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Deposit',
      installment: 'Installment',
      late_fee: 'Late Fee',
      cancellation_fee: 'Cancellation Fee',
      refund: 'Refund',
      adjustment: 'Adjustment',
      write_off: 'Write Off',
    };
    return labels[type] || type;
  };

  const getTypeStyle = (type) => {
    const styles = {
      deposit: 'bg-blue-100 text-blue-700',
      installment: 'bg-green-100 text-green-700',
      late_fee: 'bg-orange-100 text-orange-700',
      cancellation_fee: 'bg-red-100 text-red-700',
      refund: 'bg-purple-100 text-purple-700',
      adjustment: 'bg-gray-100 text-gray-700',
      write_off: 'bg-gray-100 text-gray-700',
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Transaction History</h1>
        <p className="text-gray-500 text-sm">Complete log of all your layby transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <p className="text-gray-500 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Balance After</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="block text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(tx.type)}`}>
                          {getTypeLabel(tx.type)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <p className="text-gray-900">{tx.note || getTypeLabel(tx.type)}</p>
                        {tx.order?.orderNumber && (
                          <p className="text-xs text-gray-400 mt-0.5">Order #{tx.order.orderNumber}</p>
                        )}
                        {tx.paymentMethod && (
                          <p className="text-xs text-gray-400 capitalize">{tx.paymentMethod}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-right whitespace-nowrap">
                        <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {tx.amount >= 0 ? '+' : '-'}{formatPrice(Math.abs(tx.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 text-right whitespace-nowrap">
                        {formatPrice(tx.balanceAfter || 0)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                          tx.status === 'reversed' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
