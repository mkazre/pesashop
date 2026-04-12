import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { serviceTypesAPI, serviceRequestsAPI, settingsAPI } from '@/services/api';
import api from '@/services/api';
import { useAuthStore } from '@/store';
import toast from '@/utils/toast';

const MODES = [
  { value: 'repair',   label: 'Repair',   icon: '🔨', desc: 'Fix something that is broken or not working' },
  { value: 'install',  label: 'Install',  icon: '⚡', desc: 'Set up or fit a new product or system' },
  { value: 'maintain', label: 'Maintain', icon: '🔧', desc: 'Regular upkeep and servicing' },
];


export default function ServiceProvidersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeSection, setActiveSection] = useState(null); // 'request' | 'apply' | null

  // Hero/settings
  const { data: settingsData } = useQuery('public-settings', () =>
    settingsAPI.getPublic().then(r => r.data.data || r.data)
  );
  const hero = settingsData?.servicePageHero || {};

  // Service Types
  const { data: typesData, isLoading: typesLoading } = useQuery(
    'service-types-public',
    () => serviceTypesAPI.getAll().then(r => r.data.data || []),
    { staleTime: 5 * 60 * 1000 }
  );
  const serviceTypes = typesData || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero Section ── */}
      <HeroSection hero={hero} />

      {/* ── Services Grid ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Our Services</h2>
          <p className="text-gray-500 mt-2">Professional services available in your area</p>
        </div>

        {typesLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : serviceTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔧</p>
            <p className="text-gray-500">No services listed yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {serviceTypes.map(st => (
              <ServiceTypeCard
                key={st._id}
                serviceType={st}
                onSelect={() => setActiveSection('request')}
              />
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setActiveSection(activeSection === 'request' ? null : 'request')}
            className="px-8 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            🙋 Request a Service
          </button>
          <button
            onClick={() => setActiveSection(activeSection === 'apply' ? null : 'apply')}
            className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors shadow-sm"
          >
            💼 Apply as a Service Provider
          </button>
        </div>
      </section>

      {/* ── Request a Service Form ── */}
      {activeSection === 'request' && (
        <ServiceRequestForm
          serviceTypes={serviceTypes}
          user={user}
          isAuthenticated={isAuthenticated}
          onClose={() => setActiveSection(null)}
        />
      )}

      {/* ── Apply as Provider Form ── */}
      {activeSection === 'apply' && (
        <ProviderApplicationForm
          serviceTypes={serviceTypes}
          onClose={() => setActiveSection(null)}
        />
      )}

      {/* ── Bottom spacer ── */}
      <div className="h-16" />
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function HeroSection({ hero }) {
  return (
    <div
      className="relative bg-gray-900 text-white overflow-hidden"
      style={hero.imageUrl ? {
        backgroundImage: `url(${hero.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {hero.imageUrl && <div className="absolute inset-0 bg-black/55" />}
      <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          {hero.title || 'Professional Services'}
        </h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          {hero.subtitle || 'Book trusted professionals for repairs, installations & maintenance'}
        </p>
      </div>
    </div>
  );
}

// ─── Service Type Card ───────────────────────────────────────────────────────
function ServiceTypeCard({ serviceType, onSelect }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      {serviceType.imageUrl ? (
        <img src={serviceType.imageUrl} alt={serviceType.title} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center text-5xl">
          {serviceType.icon || '🔧'}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">
          {serviceType.icon && !serviceType.imageUrl && ''}{serviceType.title}
        </h3>
        {serviceType.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{serviceType.description}</p>
        )}
        {serviceType.areasServiced?.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            📍 {serviceType.areasServiced.slice(0, 3).join(', ')}{serviceType.areasServiced.length > 3 ? ` +${serviceType.areasServiced.length - 3} more` : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {(serviceType.serviceModes || []).map(m => (
            <span key={m} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs capitalize font-medium">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Request Form ────────────────────────────────────────────────────────────
function ServiceRequestForm({ serviceTypes, user, isAuthenticated, onClose }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
    serviceTypeId: '',
    serviceModes: [],
    description: '',
    address:  '',
    suburb:   '',
    city:     '',
    province: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation(
    (data) => serviceRequestsAPI.submit(data),
    {
      onSuccess: () => setSubmitted(true),
      onError: (e) => toast.error(e.response?.data?.message || 'Submission failed'),
    }
  );

  // Pre-fill address from account
  useState(() => {
    if (isAuthenticated && user?.addresses?.length > 0) {
      const addr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setForm(f => ({
        ...f,
        address: addr.address || addr.line1 || '',
        suburb:  addr.suburb || '',
        city:    addr.city || '',
        province: addr.province || addr.state || '',
      }));
    }
  });

  const toggleMode = (m) => {
    setForm(f => ({
      ...f,
      serviceModes: f.serviceModes.includes(m) ? f.serviceModes.filter(x => x !== m) : [...f.serviceModes, m],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.serviceTypeId) { toast.error('Please select a service'); return; }
    submitMutation.mutate(form);
  };

  return (
    <section className="max-w-2xl mx-auto px-4 pb-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Request a Service</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">✅</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
              <p className="text-gray-500 mb-6">We've received your service request and will contact you soon to confirm your booking.</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 0821234567" />
                </div>
              </div>

              {/* Service */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Type *</label>
                <select required value={form.serviceTypeId} onChange={e => setForm(f => ({ ...f, serviceTypeId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— Select a service —</option>
                  {serviceTypes.map(st => (
                    <option key={st._id} value={st._id}>{st.icon} {st.title}</option>
                  ))}
                </select>
              </div>

              {/* Service Modes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">What do you need?</label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => toggleMode(m.value)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors text-center ${
                        form.serviceModes.includes(m.value)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.icon}</span>
                      <span className="text-xs font-semibold">{m.label}</span>
                      <span className="text-xs text-gray-400 mt-0.5 line-clamp-2">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2" placeholder="Street address" />
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Suburb" />
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="City" />
                  <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Province / Region" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Notes</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Describe what needs to be done..." />
              </div>

              <button
                type="submit"
                disabled={submitMutation.isLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {submitMutation.isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Provider Application Form ───────────────────────────────────────────────
function ProviderApplicationForm({ serviceTypes, onClose }) {
  const [form, setForm] = useState({
    businessName: '', contactName: '', email: '', phone: '', website: '',
    bio: '', categoryId: '', province: '', city: '',
    serviceAreas: [],
    serviceModes: [],
    password: '', confirmPassword: '',
  });
  const [areaInput, setAreaInput] = useState('');
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation(
    (formData) => api.post('/api/service-providers/apply', formData),
    {
      onSuccess: () => setSubmitted(true),
      onError: (e) => toast.error(e.response?.data?.message || 'Submission failed'),
    }
  );

  const toggleMode = (m) => setForm(f => ({
    ...f,
    serviceModes: f.serviceModes.includes(m) ? f.serviceModes.filter(x => x !== m) : [...f.serviceModes, m],
  }));

  const addArea = () => {
    const v = areaInput.trim();
    if (v && !form.serviceAreas.includes(v)) setForm(f => ({ ...f, serviceAreas: [...f.serviceAreas, v] }));
    setAreaInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(val => fd.append(k, val));
      else fd.append(k, v);
    });
    files.forEach((f, i) => {
      fd.append('documents', f);
      fd.append(`docType_${i}`, f.docType || 'other');
      fd.append(`docLabel_${i}`, f.name);
    });

    submitMutation.mutate(fd);
  };

  return (
    <section className="max-w-2xl mx-auto px-4 pb-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Apply as a Service Provider</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">🎉</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-500 mb-6">Thank you for applying! Our team will review your application and get back to you within 2–3 business days.</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Business Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business Name *</label>
                  <input required value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Your business name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person *</label>
                  <input required value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0821234567" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                </div>
              </div>

              {/* Service Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Category *</label>
                <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— Select your service category —</option>
                  {serviceTypes.map(st => (
                    <option key={st._id} value={st._id}>{st.icon} {st.title}</option>
                  ))}
                </select>
              </div>

              {/* Modes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Services Offered</label>
                <div className="flex gap-3">
                  {MODES.map(m => (
                    <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.serviceModes.includes(m.value)} onChange={() => toggleMode(m.value)} className="rounded" />
                      <span className="text-sm">{m.icon} {m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Province *</label>
                  <input required value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Gauteng, Western Cape" />
                </div>
              </div>

              {/* Areas */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Service Areas</label>
                <div className="flex gap-2 mb-2">
                  <input value={areaInput} onChange={e => setAreaInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Sandton, Midrand..." />
                  <button type="button" onClick={addArea} className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm">Add</button>
                </div>
                {form.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.serviceAreas.map(a => (
                      <span key={a} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                        {a}
                        <button type="button" onClick={() => setForm(f => ({ ...f, serviceAreas: f.serviceAreas.filter(x => x !== a) }))} className="text-blue-400 hover:text-blue-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">About Your Business</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Tell us about your experience, qualifications, and services..." />
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Documents <span className="text-gray-400 font-normal">(ID, Trade Certificate, Proof of Business)</span></label>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFiles(Array.from(e.target.files))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700" />
                {files.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Create Password *</label>
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Min. 8 characters" minLength={8} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
                  <input required type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                By submitting, you agree to our terms and conditions. We'll review your application and contact you within 2–3 business days.
              </p>

              <button
                type="submit"
                disabled={submitMutation.isLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {submitMutation.isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
