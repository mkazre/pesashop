import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'react-query';
import { laybyAPI } from '@/services/api';
import { useAuthStore, useUIStore } from '@/store';

export default function LaybyWidget({ product }) {
  const { isAuthenticated, user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState('terms'); // 'terms' | 'form'
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
      }
    }
  );

  // Don't render if layby is disabled
  if (!settings?.enabled || !settings?.widgetEnabled) return null;

  const handleOpenModal = () => {
    if (isAuthenticated && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        notes: ''
      });
    }
    setShowModal(true);
    setStep('terms');
    setAgreed(false);
    setSubmitted(false);
    setIdFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idFile) return;

    const fd = new FormData();
    fd.append('firstName', formData.firstName);
    fd.append('lastName', formData.lastName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('productId', product._id);
    fd.append('notes', formData.notes);
    fd.append('idDocument', idFile);

    submitMutation.mutate(fd);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setIdFile(file);
    }
  };

  const buttonText = settings?.widgetButtonText || 'GET IT ON LAYBY';

  return (
    <>
      {/* CTA Button */}
      <button
        onClick={handleOpenModal}
        className="w-full mt-3 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        {buttonText}
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {submitted ? 'Application Submitted!' : step === 'terms' ? 'Layby Terms & Conditions' : 'Apply for Layby'}
                  </h2>
                  <p className="text-amber-100 text-sm mt-1">{product.name}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {submitted ? (
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
                  <p className="text-sm text-gray-500">
                    A confirmation has been sent to <strong>{formData.email}</strong>
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
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

                  {/* Product Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-800 font-medium">Product</p>
                        <p className="font-bold text-gray-900">{product.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-800 font-medium">Price</p>
                        <p className="text-xl font-bold text-gray-900">
                          R {(product.salePrice || product.regularPrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

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
            {!submitted && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
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
