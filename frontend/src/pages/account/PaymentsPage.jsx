import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { laybyAPI } from '@/services/api';

export default function PaymentsPage() {
  const { data: laybyesData, isLoading } = useQuery('myLaybyes', () => laybyAPI.getMyLaybyes());
  const laybyes = laybyesData?.data?.data || [];

  // Collect all payments across all laybyes
  const allPayments = [];
  laybyes.forEach((laybye) => {
    (laybye.payments || []).forEach((payment) => {
      allPayments.push({
        ...payment,
        laybyeId: laybye._id,
        laybyeName: laybye.laybyPlan?.name || `Laybye #${laybye._id?.slice(-6)}`,
        orderNumber: laybye.order?.orderNumber,
      });
    });
  });

  // Sort by date descending
  allPayments.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));

  // Calculate totals
  const totalPaid = allPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const activeLaybyes = laybyes.filter(l => l.status === 'active');
  const totalOutstanding = activeLaybyes.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Payments</h1>
        <p className="text-gray-500 text-sm">Overview of all your layby payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">R {totalPaid.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{allPayments.filter(p => p.status === 'completed').length} payments</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600">R {totalOutstanding.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{activeLaybyes.length} active laybyes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Next Payment Due</p>
          {activeLaybyes.length > 0 ? (() => {
            const upcoming = activeLaybyes
              .filter(l => l.nextPaymentDate)
              .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
            const next = upcoming[0];
            if (!next) return <p className="text-2xl font-bold text-gray-400">N/A</p>;
            const isOverdue = new Date(next.nextPaymentDate) < new Date();
            return (
              <>
                <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  R {(next.installmentPlan?.installmentAmount || 0).toFixed(2)}
                </p>
                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {isOverdue ? 'OVERDUE — ' : ''}{new Date(next.nextPaymentDate).toLocaleDateString('en-ZA')}
                </p>
              </>
            );
          })() : (
            <p className="text-2xl font-bold text-gray-400">N/A</p>
          )}
        </div>
      </div>

      {/* Upcoming Payments */}
      {activeLaybyes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Upcoming Payments</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeLaybyes
              .filter(l => l.nextPaymentDate)
              .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))
              .map((laybye) => {
                const isOverdue = new Date(laybye.nextPaymentDate) < new Date();
                return (
                  <div key={laybye._id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {laybye.laybyPlan?.name || `Laybye #${laybye._id?.slice(-6)}`}
                      </p>
                      <p className={`text-sm mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {isOverdue ? 'Overdue — ' : 'Due: '}
                        {new Date(laybye.nextPaymentDate).toLocaleDateString('en-ZA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">R {(laybye.installmentPlan?.installmentAmount || 0).toFixed(2)}</p>
                      <Link
                        to="/account/laybyes"
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Pay Now
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Payment History</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading payments...</p>
          </div>
        ) : allPayments.length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            <p className="text-gray-500 font-medium">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Laybye</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPayments.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-600">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-ZA') : 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <p className="font-medium text-gray-900">{payment.laybyeName}</p>
                      {payment.orderNumber && <p className="text-xs text-gray-400">Order #{payment.orderNumber}</p>}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 capitalize">{payment.paymentMethod || 'N/A'}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">
                      R {(payment.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
