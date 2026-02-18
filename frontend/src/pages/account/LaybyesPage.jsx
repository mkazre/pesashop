import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { laybyAPI, settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function LaybyesPage() {
  const queryClient = useQueryClient();
  const [selectedLaybye, setSelectedLaybye] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState('amount'); // 'amount' | 'method' | 'eft' | 'cash' | 'online' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'applications'

  const { data: laybyesData, isLoading } = useQuery('myLaybyes', () => laybyAPI.getMyLaybyes());
  const { data: applicationsData } = useQuery('myApplications', () => laybyAPI.getMyApplications());
  const { data: bankDetailsData } = useQuery('bankDetails', () => settingsAPI.getBankDetails(), { staleTime: 10 * 60 * 1000 });

  const bankDetails = bankDetailsData?.data?.data || [];

  const payMutation = useMutation(
    ({ id, data }) => laybyAPI.makePayment(id, data),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('myLaybyes');
        queryClient.invalidateQueries('myTransactions');
        const msg = res.data?.message || 'Payment recorded';
        if (paymentMethod === 'eft' || paymentMethod === 'cash') {
          setPayStep('success');
        } else {
          toast.success(msg);
          closePayModal();
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Payment failed');
      }
    }
  );

  const laybyes = laybyesData?.data?.data || [];
  const applications = applicationsData?.data?.data || [];

  const activeLaybyes = laybyes.filter(l => l.status === 'active');
  const completedLaybyes = laybyes.filter(l => l.status !== 'active');

  const openPayModal = (laybye) => {
    setSelectedLaybye(laybye);
    setPaymentAmount((laybye.installmentPlan?.installmentAmount || 0).toFixed(2));
    setPayStep('amount');
    setPaymentMethod('');
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setPaymentAmount('');
    setSelectedLaybye(null);
    setPayStep('amount');
    setPaymentMethod('');
  };

  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    if (method === 'eft') {
      setPayStep('eft');
    } else if (method === 'cash') {
      setPayStep('cash');
    } else if (method === 'online') {
      setPayStep('online');
    }
  };

  const handleSubmitPayment = () => {
    if (!selectedLaybye || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    payMutation.mutate({
      id: selectedLaybye._id,
      data: {
        amount: parseFloat(paymentAmount),
        paymentMethod: paymentMethod,
        note: paymentMethod === 'eft' ? 'EFT bank transfer' : paymentMethod === 'cash' ? 'Cash payment' : ''
      }
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      defaulted: 'bg-orange-100 text-orange-700 border-orange-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`;
  };

  const getProgressPercent = (laybye) => {
    if (!laybye.totalAmount) return 0;
    return Math.min(100, Math.round((laybye.paidAmount / laybye.totalAmount) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Laybyes</h1>
        <p className="text-gray-500 text-sm">Manage your layby plans and make payments</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'active', label: 'Active', count: activeLaybyes.length },
            { id: 'completed', label: 'History', count: completedLaybyes.length },
            { id: 'applications', label: 'Applications', count: applications.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : activeTab === 'active' ? (
            activeLaybyes.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <p className="text-gray-500 font-medium">No active laybyes</p>
                <p className="text-sm text-gray-400 mt-1">Browse our products and apply for a layby plan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLaybyes.map((laybye) => {
                  const progress = getProgressPercent(laybye);
                  const isOverdue = laybye.nextPaymentDate && new Date(laybye.nextPaymentDate) < new Date();
                  return (
                    <div key={laybye._id} className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {laybye.laybyPlan?.name || `Laybye #${laybye._id?.slice(-6)}`}
                            </h3>
                            <span className={getStatusBadge(laybye.status)}>{laybye.status}</span>
                            {isOverdue && <span className={getStatusBadge('defaulted')}>Overdue</span>}
                          </div>
                          {laybye.order?.orderNumber && (
                            <p className="text-sm text-gray-500 mt-1">Order #{laybye.order.orderNumber}</p>
                          )}
                        </div>
                        <button
                          onClick={() => openPayModal(laybye)}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                        >
                          Make Payment
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-500">Payment Progress</span>
                          <span className="font-medium text-gray-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Amount</p>
                          <p className="font-semibold text-gray-900">R {(laybye.totalAmount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Paid</p>
                          <p className="font-semibold text-green-600">R {(laybye.paidAmount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining</p>
                          <p className="font-semibold text-red-600">R {(laybye.remainingAmount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Next Payment</p>
                          <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {laybye.nextPaymentDate ? new Date(laybye.nextPaymentDate).toLocaleDateString('en-ZA') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Installment Info */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {laybye.installmentPlan?.frequency} payments of R {(laybye.installmentPlan?.installmentAmount || 0).toFixed(2)}
                        </span>
                        {laybye.expiryDate && (
                          <span className="text-gray-400">
                            Expires: {new Date(laybye.expiryDate).toLocaleDateString('en-ZA')}
                          </span>
                        )}
                      </div>

                      {/* Payment History */}
                      {laybye.payments && laybye.payments.length > 0 && (
                        <details className="mt-4">
                          <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                            Payment History ({laybye.payments.length} payments)
                          </summary>
                          <div className="mt-3 space-y-2">
                            {laybye.payments.map((payment, idx) => (
                              <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${payment.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">R {(payment.amount || 0).toFixed(2)}</span>
                                  <span className="text-gray-400">{payment.paymentMethod}</span>
                                  {payment.status === 'pending' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>
                                  )}
                                  {payment.status === 'failed' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">Rejected</span>
                                  )}
                                </div>
                                <span className="text-gray-500">
                                  {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-ZA') : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'completed' ? (
            completedLaybyes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed or cancelled laybyes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedLaybyes.map((laybye) => (
                  <div key={laybye._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{laybye.laybyPlan?.name || `Laybye #${laybye._id?.slice(-6)}`}</p>
                        <span className={getStatusBadge(laybye.status)}>{laybye.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        R {(laybye.totalAmount || 0).toFixed(2)} — {laybye.payments?.filter(p => p.status === 'completed').length || 0} payments
                      </p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(laybye.updatedAt || laybye.createdAt).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Applications Tab */
            applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No layby applications</p>
                <p className="text-sm text-gray-400 mt-1">Apply for a layby from any product page</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{app.productName}</p>
                          <span className={getStatusBadge(app.status)}>{app.status}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">R {(app.productPrice || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Applied: {new Date(app.createdAt).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                      {app.status === 'rejected' && app.rejectionReason && (
                        <div className="text-right max-w-[200px]">
                          <p className="text-xs text-red-600">{app.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Payment Modal — Multi-step */}
      {showPayModal && selectedLaybye && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePayModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-900 px-6 py-5 text-white">
              <h2 className="text-lg font-bold">
                {payStep === 'success' ? 'Payment Submitted' : 'Make a Payment'}
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {selectedLaybye.laybyPlan?.name || `Laybye #${selectedLaybye._id?.slice(-6)}`}
              </p>
            </div>

            {/* Step 1: Enter Amount */}
            {payStep === 'amount' && (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Outstanding</p>
                    <p className="font-bold text-lg text-gray-900">R {(selectedLaybye.remainingAmount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Suggested</p>
                    <p className="font-bold text-lg text-gray-900">R {(selectedLaybye.installmentPlan?.installmentAmount || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Amount (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedLaybye.remainingAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={closePayModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancel</button>
                  <button
                    onClick={() => setPayStep('method')}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedLaybye.remainingAmount + 0.01}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Choose Payment Method */}
            {payStep === 'method' && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-2">Amount: <span className="font-bold text-gray-900">R {parseFloat(paymentAmount).toFixed(2)}</span></p>
                <p className="text-sm font-medium text-gray-700 mb-3">How would you like to pay?</p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleMethodSelect('eft')}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">EFT / Bank Transfer</p>
                        <p className="text-xs text-gray-500">Transfer funds to our bank account</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleMethodSelect('cash')}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cash Payment</p>
                        <p className="text-xs text-gray-500">Record a cash payment for admin verification</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleMethodSelect('online')}
                    className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Pay Online</p>
                        <p className="text-xs text-gray-500">Pay securely with a payment gateway</p>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex items-center justify-start pt-2">
                  <button onClick={() => setPayStep('amount')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                </div>
              </div>
            )}

            {/* Step 3a: EFT — Show Bank Details */}
            {payStep === 'eft' && (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">EFT / Bank Transfer</p>
                  <p className="text-xs text-blue-600">Please transfer <span className="font-bold">R {parseFloat(paymentAmount).toFixed(2)}</span> to one of the accounts below and use your order/layby reference.</p>
                </div>
                {bankDetails.length > 0 ? (
                  <div className="space-y-3">
                    {bankDetails.map((bank, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="font-semibold text-gray-900 mb-2">{bank.bankName}</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                          {bank.accountName && <><p className="text-gray-500">Account Name</p><p className="font-medium text-gray-900">{bank.accountName}</p></>}
                          {bank.accountNumber && <><p className="text-gray-500">Account No.</p><p className="font-medium text-gray-900">{bank.accountNumber}</p></>}
                          {bank.branchCode && <><p className="text-gray-500">Branch Code</p><p className="font-medium text-gray-900">{bank.branchCode}</p></>}
                          {bank.accountType && <><p className="text-gray-500">Account Type</p><p className="font-medium text-gray-900">{bank.accountType}</p></>}
                          {bank.reference && <><p className="text-gray-500">Reference</p><p className="font-medium text-gray-900">{bank.reference}</p></>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <p>No bank details configured. Please contact the store for banking information.</p>
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">Your payment will be marked as <span className="font-bold">pending</span> until the store verifies the funds have been received.</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setPayStep('method')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                  <button
                    onClick={handleSubmitPayment}
                    disabled={payMutation.isLoading}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {payMutation.isLoading ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
                    ) : (
                      "I've Made the Transfer"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3b: Cash — Confirm */}
            {payStep === 'cash' && (
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-1">Cash Payment</p>
                  <p className="text-xs text-green-600">You are recording a cash payment of <span className="font-bold">R {parseFloat(paymentAmount).toFixed(2)}</span>.</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">Your payment will be marked as <span className="font-bold">pending</span> until the store admin verifies the funds have been received.</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setPayStep('method')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                  <button
                    onClick={handleSubmitPayment}
                    disabled={payMutation.isLoading}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {payMutation.isLoading ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
                    ) : (
                      'Submit Cash Payment'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3c: Online — Placeholder */}
            {payStep === 'online' && (
              <div className="p-6 space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <svg className="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  <p className="text-sm font-medium text-purple-800 mb-1">Online Payment Coming Soon</p>
                  <p className="text-xs text-purple-600">Payment gateways are being set up. Please use EFT or Cash payment for now.</p>
                </div>
                <div className="flex items-center justify-start pt-2">
                  <button onClick={() => setPayStep('method')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">← Back</button>
                </div>
              </div>
            )}

            {/* Success Screen */}
            {payStep === 'success' && (
              <div className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Payment Submitted</h3>
                <p className="text-sm text-gray-600">
                  Your {paymentMethod === 'eft' ? 'EFT' : 'cash'} payment of <span className="font-bold">R {parseFloat(paymentAmount).toFixed(2)}</span> has been recorded and is awaiting verification by the store.
                </p>
                <p className="text-xs text-gray-400">You will be notified once the payment has been confirmed.</p>
                <button
                  onClick={closePayModal}
                  className="mt-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
