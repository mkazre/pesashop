import { useState, useEffect } from 'react';
import { serviceProviderAdsAPI } from '@/services/api';

const STEPS = ['Your Details', 'Request Info'];

export default function ServiceProviderAdModal({ ad, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    location: '', additionalInfo: '', preferredDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return 'Please enter your name.';
      if (!form.phone.trim()) return 'Please enter your phone number.';
      if (!form.email.trim() || !form.email.includes('@')) return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await serviceProviderAdsAPI.submitEnquiry(ad._id, form);
      setSuccess(true);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} />

      {/* Modal */}
      <div
        style={{ position: 'relative', background: '#fff', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
        >
          ×
        </button>

        {/* Ad banner */}
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg, #1b5e35, #2d7a4f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 }}>🏢</span>
          </div>
        )}

        {/* Ad details */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.3, margin: 0 }}>{ad.title}</h2>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#76889a', letterSpacing: '0.08em', flexShrink: 0, marginTop: 4 }}>AD</span>
          </div>
          {ad.body && (
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>{ad.body}</p>
          )}
        </div>

        <div style={{ height: 1, background: '#e5eae6', margin: '20px 0 0' }} />

        {/* Form area */}
        {success ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
              ✓
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Enquiry Submitted!</h3>
            <p style={{ fontSize: 14, color: '#76889a', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
              Thank you! We've received your enquiry and will review it shortly. You'll hear from us soon.
            </p>
            <button
              onClick={onClose}
              style={{ padding: '10px 28px', background: '#1b5e35', color: '#a8ffca', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 28px' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
              {STEPS.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < step ? '#1b5e35' : i === step ? '#1b5e35' : '#e5eae6',
                      color: i <= step ? '#a8ffca' : '#76889a',
                      flexShrink: 0,
                    }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? '#1a1a1a' : '#76889a' }}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: i < step ? '#1b5e35' : '#e5eae6', margin: '0 10px' }} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, padding: '10px 14px', marginBottom: 16 }}>
                {error}
              </div>
            )}

            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. John Smith" />
                <Field label="Phone Number *" value={form.phone} onChange={v => set('phone', v)} placeholder="e.g. 0712 345 678" type="tel" />
                <Field label="Email Address *" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" type="email" />
                <button
                  type="button"
                  onClick={handleNext}
                  style={{ width: '100%', padding: '12px', background: '#1b5e35', color: '#a8ffca', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em', marginTop: 4 }}
                >
                  Next →
                </button>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Your Location" value={form.location} onChange={v => set('location', v)} placeholder="e.g. Sandton, Johannesburg" />
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Preferred Date for Assistance
                  </label>
                  <input
                    type="date"
                    value={form.preferredDate}
                    onChange={e => set('preferredDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', border: '1px solid #e5eae6', padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Additional Information
                  </label>
                  <textarea
                    value={form.additionalInfo}
                    onChange={e => set('additionalInfo', e.target.value)}
                    placeholder="Describe what you need help with, any relevant details…"
                    rows={3}
                    style={{ width: '100%', border: '1px solid #e5eae6', padding: '10px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(0); setError(''); }}
                    style={{ flex: 1, padding: '12px', background: '#f6f7f8', color: '#1a1a1a', border: '1px solid #e5eae6', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, padding: '12px', background: loading ? '#76889a' : '#1b5e35', color: '#a8ffca', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em' }}
                  >
                    {loading ? 'Submitting…' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #e5eae6', padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#1b5e35'}
        onBlur={e => e.target.style.borderColor = '#e5eae6'}
      />
    </div>
  );
}
