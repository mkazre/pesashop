import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { laybyAPI } from '@/services/api';
import { useAuthStore, useUIStore, useCartStore, useCurrencyStore } from '@/store';
import toast from 'react-hot-toast';

/**
 * LaybyWidget — Handles the full layby application flow:
 *   1. If not authenticated → open auth modal first
 *   2. Show Terms & Conditions popup → agree
 *   3. Show application form (pre-filled for logged-in user) with ID upload
 *   4. Submit → show confirmation
 *
 * Props:
 *   product       — the product object
 *   selectedPlan  — (optional) { plan, deposit, installment } from InlineLaybyePlans
 *   showButton    — (default true) whether to render the CTA button (false when triggered externally)
 *   isOpen        — (optional) controlled open state
 *   onClose       — (optional) callback when modal closes
 */
export default function LaybyWidget({ product, selectedPlan, showButton = true, isOpen: controlledOpen, onClose }) {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { formatPrice } = useCurrencyStore();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState('checking'); // 'checking' | 'auto-approved' | 'pending-review' | 'terms' | 'form'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [idFile, setIdFile] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eligibility, setEligibility] = useState(null); // { eligible, application, pending }
  const fileInputRef = useRef(null);

  const { data: settingsData } = useQuery(
    'laybySettings',
    () => laybyAPI.getSettings(),
    { staleTime: 5 * 60 * 1000 }
  );

  const settings = settingsData?.data?.data;

  const submitMutation = useMutation(
    (data) => laybyAPI.submitApplication(data),
    {
      onSuccess: () => {
        setSubmitted(true);
        setStep('terms');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Application failed. Please try again.');
      }
    }
  );

  // Check eligibility and open modal
  const checkAndOpen = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      toast('Please sign in or register to apply for a layby', { icon: '🔐' });
      onClose?.();
      return;
    }

    // Pre-fill form with user data
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      notes: ''
    });
    setShowModal(true);
    setStep('checking');
    setAgreed(false);
    setSubmitted(false);
    setIdFile(null);
    setEligibility(null);

    // Call eligibility check
    try {
      const res = await laybyAPI.checkEligibility();
      const data = res.data;
      setEligibility(data);
      if (data.eligible) {
        setStep('auto-approved');
      } else if (data.pending) {
        setStep('pending-review');
      } else {
        setStep('terms');
      }
    } catch {
      // If eligibility check fails (e.g. network), fall back to normal flow
      setStep('terms');
    }
  };

  // Sync controlled open state
  useEffect(() => {
    if (controlledOpen === true) {
      checkAndOpen();
    } else if (controlledOpen === false) {
      setShowModal(false);
    }
  }, [controlledOpen, isAuthenticated]);

  // Don't render if layby is disabled (but allow rendering if settings haven't loaded yet for controlled mode)
  if (settings && (!settings.enabled || !settings.widgetEnabled) && !controlledOpen) return null;

  const productPrice = product?.salePrice || product?.regularPrice || 0;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Get all cart items that have laybye selected (multi-item support)
  const cartItems = useCartStore((s) => s.items);
  const laybyeCartItems = cartItems.filter(i => !!i.laybye);

  const initiateOpen = () => {
    checkAndOpen();
  };

  const handleClose = () => {
    setShowModal(false);
    onClose?.();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!idFile) {
      toast.error('Please upload your ID or Passport document');
      return;
    }

    const fd = new FormData();
    fd.append('firstName', formData.firstName);
    fd.append('lastName', formData.lastName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('productId', product._id);
    fd.append('notes', formData.notes);
    fd.append('idDocument', idFile);

    // Include plan details if a plan was selected
    if (selectedPlan?.plan) {
      fd.append('laybyPlanId', selectedPlan.plan._id);
      fd.append('planName', selectedPlan.plan.name || '');
      fd.append('depositAmount', selectedPlan.deposit || 0);
      fd.append('installmentAmount', selectedPlan.installment || 0);
      fd.append('numberOfPayments', selectedPlan.plan.numberOfPayments || 0);
      fd.append('frequency', selectedPlan.plan.frequency || 'monthly');
    }

    submitMutation.mutate(fd);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setIdFile(file);
    }
  };

  const frequencyLabel = (freq) => {
    switch (freq) {
      case 'weekly': return 'week';
      case 'biweekly': return '2 weeks';
      case 'monthly': return 'month';
      default: return 'month';
    }
  };

  const buttonText = settings?.widgetButtonText || 'GET IT ON LAYBY';

  return (
    <>
      {/* CTA Button (optional — hidden when triggered externally) */}
      {showButton && (
        <button
          onClick={initiateOpen}
          className="w-full mt-3 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          {buttonText}
        </button>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-40 sm:pt-36 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`px-5 py-3.5 text-white ${step === 'auto-approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : step === 'pending-review' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {submitted ? 'Application Submitted!' : step === 'checking' ? 'Checking Eligibility...' : step === 'auto-approved' ? 'You\'re Pre-Approved!' : step === 'pending-review' ? 'Application Under Review' : step === 'terms' ? 'Layby Terms & Conditions' : 'Apply for Layby'}
                  </h2>
                  <p className={`text-sm mt-1 ${step === 'auto-approved' ? 'text-green-100' : 'text-amber-100'}`}>{product.name}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {step === 'checking' ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Checking your eligibility...</p>
                  <p className="text-sm text-gray-400 mt-1">This will only take a moment</p>
                </div>
              ) : step === 'auto-approved' ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
                  <p className="text-gray-600 mb-1 text-base">
                    You've been <strong className="text-green-600">automatically approved</strong> for laybye.
                  </p>
                  <p className="text-sm text-gray-500 mb-5">
                    Your previous application was approved less than 3 months ago, so there's no need to reapply. Your verified details are already on file.
                  </p>

                  {eligibility?.application && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-left">
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-2">Verified Account Details</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Name</p>
                          <p className="font-medium text-gray-900">{eligibility.application.firstName} {eligibility.application.lastName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Email</p>
                          <p className="font-medium text-gray-900">{eligibility.application.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Phone</p>
                          <p className="font-medium text-gray-900">{eligibility.application.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Approved On</p>
                          <p className="font-medium text-gray-900">{eligibility.application.approvedAt ? new Date(eligibility.application.approvedAt).toLocaleDateString('en-ZA') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show laybye cart items if any */}
                  {laybyeCartItems.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
                      <p className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-2">Items on Laybye ({laybyeCartItems.length})</p>
                      <div className="space-y-2">
                        {laybyeCartItems.map((item, idx) => {
                          const price = item.product.salePrice || item.product.regularPrice || 0;
                          return (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-800 truncate">{item.product.name} × {item.quantity}</span>
                              <span className="font-semibold text-gray-900 ml-2">{formatPrice(price * item.quantity)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-amber-200 mt-2 pt-2 flex items-center justify-between text-sm">
                        <span className="text-amber-800 font-medium">Total Deposit</span>
                        <span className="font-bold text-gray-900">{formatPrice(laybyeCartItems.reduce((t, i) => t + (i.laybye?.deposit || 0) * i.quantity, 0))}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-5">
                    Simply proceed to checkout and your laybye will be created instantly — no additional paperwork required.
                  </p>

                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-bold text-sm shadow-lg hover:shadow-xl"
                  >
                    Got It — Continue to Checkout
                  </button>
                </div>
              ) : step === 'pending-review' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h3>
                  <p className="text-gray-600 mb-4">
                    You already have a laybye application that's currently being reviewed by our team. We'll notify you by email as soon as it's been processed.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    You can check the status anytime in <strong>My Account → Laybyes</strong>.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600 mb-4">
                    Your layby application has been submitted successfully. Our team will review your application and get back to you shortly.
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    A confirmation has been sent to <strong>{formData.email}</strong>
                  </p>
                  <p className="text-sm text-gray-400">
                    You can track your application status in <strong>My Account → Laybyes</strong>
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : step === 'terms' ? (
                <div>
                  {/* Terms Content */}
                  <div className="prose prose-sm max-w-none mb-6">
                    {settings?.termsAndConditions ? (
                      <div
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-[40vh] overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: settings.termsAndConditions.replace(/\n/g, '<br/>') }}
                      />
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 italic">
                        Terms and conditions have not been configured yet. Please contact the store for more information.
                      </div>
                    )}
                  </div>

                  {/* Items Being Laybyed (multi-item support) */}
                  {laybyeCartItems.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <p className="text-[10px] font-medium text-amber-800 uppercase tracking-wider mb-2">Items Being Laybyed ({laybyeCartItems.length})</p>
                      <div className="space-y-2">
                        {laybyeCartItems.map((item, idx) => {
                          const img = item.product?.images?.[0] || item.product?.featuredImage;
                          const imgSrc = img ? (typeof img === 'string' && img.startsWith('http') ? img : `${API_URL}${img}`) : '';
                          const price = item.product.salePrice || item.product.regularPrice || 0;
                          return (
                            <div key={idx} className="bg-white/60 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                {imgSrc && <img src={imgSrc} alt="" className="w-8 h-8 rounded object-cover border border-amber-200" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                                  <p className="text-[11px] text-gray-500">Qty: {item.quantity} × {formatPrice(price)}</p>
                                </div>
                                <p className="text-xs font-bold text-gray-900">{formatPrice(price * item.quantity)}</p>
                              </div>
                              {item.laybye?.plan && (
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                  <div className="bg-amber-50 rounded p-1">
                                    <p className="text-[9px] text-amber-700">Deposit</p>
                                    <p className="text-[11px] font-bold text-gray-900">{formatPrice((item.laybye.deposit || 0) * item.quantity)}</p>
                                  </div>
                                  <div className="bg-amber-50 rounded p-1">
                                    <p className="text-[9px] text-amber-700">{item.laybye.plan.numberOfPayments}× {frequencyLabel(item.laybye.plan.frequency)}</p>
                                    <p className="text-[11px] font-bold text-gray-900">{formatPrice((item.laybye.installment || 0) * item.quantity)}</p>
                                  </div>
                                  <div className="bg-amber-50 rounded p-1">
                                    <p className="text-[9px] text-amber-700">Plan</p>
                                    <p className="text-[11px] font-bold text-amber-900">{item.laybye.plan.name}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Totals */}
                      <div className="border-t border-amber-200 mt-2 pt-2 flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium">Total Deposit Due</span>
                        <span className="font-bold text-gray-900">
                          {formatPrice(laybyeCartItems.reduce((t, i) => t + (i.laybye?.deposit || 0) * i.quantity, 0))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-amber-800 font-medium">Product</p>
                          <p className="font-bold text-gray-900">{product.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-amber-800 font-medium">Price</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatPrice(productPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Plan breakdown if a plan was selected */}
                      {selectedPlan?.plan && (
                        <div className="border-t border-amber-200 pt-3 mt-3">
                          <p className="text-sm font-semibold text-amber-900 mb-2">💳 {selectedPlan.plan.name}</p>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/60 rounded-lg p-2">
                              <p className="text-xs text-amber-700">Deposit</p>
                              <p className="text-sm font-bold text-gray-900">{formatPrice(selectedPlan.deposit || 0)}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2">
                              <p className="text-xs text-amber-700">{selectedPlan.plan.numberOfPayments}× {frequencyLabel(selectedPlan.plan.frequency)}</p>
                              <p className="text-sm font-bold text-gray-900">{formatPrice(selectedPlan.installment || 0)}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2">
                              <p className="text-xs text-amber-700">Total</p>
                              <p className="text-sm font-bold text-gray-900">{formatPrice((selectedPlan.deposit || 0) + (selectedPlan.installment || 0) * (selectedPlan.plan.numberOfPayments || 0))}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Agreement */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      I have read and agree to the layby terms and conditions
                    </span>
                  </label>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide your details below. Our team will review your application and contact you.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      placeholder="072 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ID or Passport Copy *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        idFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {idFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-sm text-green-700 font-medium">{idFile.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIdFile(null); }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p className="text-sm text-gray-600">Click to upload your ID or Passport</p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, PDF — Max 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>

                  {submitMutation.isError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {submitMutation.error?.response?.data?.message || 'Something went wrong. Please try again.'}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            {!submitted && step !== 'checking' && step !== 'auto-approved' && step !== 'pending-review' && (
              <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 flex items-center justify-between">
                {step === 'form' && (
                  <button
                    onClick={() => setStep('terms')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    ← Back
                  </button>
                )}
                {step === 'terms' && <div />}

                {step === 'terms' ? (
                  <button
                    onClick={() => setStep('form')}
                    disabled={!agreed}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    Continue to Application →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !idFile || submitMutation.isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {submitMutation.isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
