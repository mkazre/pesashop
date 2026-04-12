import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Link } from 'react-router-dom';
import { serviceTypesAPI, serviceRequestsAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import toast from '@/utils/toast';

const MODES = [
  { value: 'repair',   label: 'Repair',   icon: '🔨' },
  { value: 'install',  label: 'Install',  icon: '⚡' },
  { value: 'maintain', label: 'Maintain', icon: '🔧' },
];

/**
 * ServiceRequestWidget — compact collapsible panel for product detail / checkout.
 * Fetches relevant service types based on product category, lets customer
 * choose service + modes and submits a request using their saved address.
 *
 * Props:
 *   product  — product object (used for category matching and name)
 *   compact  — boolean, if true shows a mini toggle style like LaybyWidget
 */
export default function ServiceRequestWidget({ product, compact = true }) {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedModes, setSelectedModes] = useState([]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch all active service types (not filtered by category — show everything)
  const { data, isLoading: typesLoading } = useQuery(
    'service-types-widget',
    () => serviceTypesAPI.getAll().then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );

  const serviceTypes = data || [];

  const submitMutation = useMutation(
    (payload) => serviceRequestsAPI.submit(payload),
    {
      onSuccess: () => {
        setSubmitted(true);
        toast.success("Request submitted! We'll be in touch soon.");
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Submission failed'),
    }
  );

  // Don't render if no services available
  if (!typesLoading && serviceTypes.length === 0) return null;

  const toggleMode = (m) => {
    setSelectedModes(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedService) { toast.error('Please select a service'); return; }

    const address = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

    submitMutation.mutate({
      firstName: user?.firstName || '',
      lastName:  user?.lastName || '',
      email:     user?.email || '',
      phone:     user?.phone || '',
      serviceTypeId: selectedService,
      serviceModes: selectedModes,
      description,
      address:  address?.address || address?.line1 || '',
      suburb:   address?.suburb || '',
      city:     address?.city || '',
      province: address?.province || address?.state || '',
      productId:   product?._id || '',
      productName: product?.name || product?.title || '',
    });
  };

  if (!compact) return null; // full page handles non-compact

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Toggle button — same style as OfferSlot/LaybyWidget */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 border-2 border-dashed border-blue-400/60 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50/50 hover:border-blue-500/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <span>
            {typesLoading ? 'Loading services...' : `Book a Professional (${serviceTypes.length} service${serviceTypes.length !== 1 ? 's' : ''} available)`}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 border border-blue-200/60 rounded-xl p-4 bg-blue-50/30 space-y-3">
          {submitted ? (
            <div className="flex items-center gap-3 py-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800 text-sm">Request submitted!</p>
                <p className="text-xs text-green-600">We'll contact you shortly to confirm your booking.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-medium">Book a professional for this product</p>

              {!isAuthenticated ? (
                <p className="text-xs text-gray-500">
                  <Link to="/service-providers" className="text-blue-600 font-medium hover:underline">View all services</Link> or{' '}
                  <button onClick={() => {}} className="text-blue-600 font-medium hover:underline">log in</button> to quickly request a service.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Service selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Service</label>
                    <select
                      value={selectedService}
                      onChange={e => setSelectedService(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="">— Choose a service —</option>
                      {serviceTypes.map(st => (
                        <option key={st._id} value={st._id}>{st.icon} {st.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mode selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">What do you need?</label>
                    <div className="flex gap-2">
                      {MODES.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => toggleMode(m.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selectedModes.includes(m.value)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <span>{m.icon}</span> {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (optional)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none bg-white"
                      placeholder="Describe the issue or what you need..."
                    />
                  </div>

                  {/* Address info */}
                  {user?.addresses?.length > 0 && (
                    <p className="text-xs text-gray-400">
                      📍 We'll use your saved address:{' '}
                      {[
                        user.addresses.find(a => a.isDefault) || user.addresses[0]
                      ].map(a => [a?.suburb, a?.city, a?.province].filter(Boolean).join(', '))}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submitMutation.isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {submitMutation.isLoading ? 'Submitting...' : 'Request Service'}
                    </button>
                    <Link
                      to="/service-providers"
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Show ALL →
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
