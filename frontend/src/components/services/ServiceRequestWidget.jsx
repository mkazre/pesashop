import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Link } from 'react-router-dom';
import { serviceTypesAPI, serviceRequestsAPI } from '@/services/api';
import { useAuthStore, useUIStore } from '@/store';
import toast from '@/utils/toast';

const MODE_LABELS = { repair: 'Repair', install: 'Install', maintain: 'Maintain' };

/**
 * ServiceRequestWidget — matches InlineLaybyePlans design exactly.
 * iOS toggle → grid of service-type cards → mode + notes form.
 */
export default function ServiceRequestWidget({ product }) {
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [enabled, setEnabled] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [selectedModes, setSelectedModes] = useState([]);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Build comma-separated category IDs from the product
  const categoryIds = useMemo(() => {
    const cats = product?.categories || [];
    return cats.map(c => (typeof c === 'object' ? c._id : c)).filter(Boolean).join(',');
  }, [product]);

  const { data, isLoading } = useQuery(
    ['service-types-widget', categoryIds],
    () => serviceTypesAPI.getAll({ categoryIds: categoryIds || undefined }).then(r => r.data.data || []),
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

  // Don't render if no services
  if (!isLoading && serviceTypes.length === 0) return null;

  const selectedType = serviceTypes.find(t => t._id === selectedTypeId) || null;

  const handleToggle = (val) => {
    if (val && !isAuthenticated) {
      openAuthModal('login');
      toast('Please sign in to book a professional', { icon: '🔐' });
      return;
    }
    setEnabled(val);
    if (!val) { setSelectedTypeId(null); setSelectedModes([]); setSubmitted(false); }
  };

  const handleSelectType = (type) => {
    setSelectedTypeId(type._id);
    // Pre-select all modes this type supports
    setSelectedModes(type.serviceModes || []);
  };

  const toggleMode = (m) => {
    setSelectedModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType) { toast.error('Please select a service type'); return; }

    const address = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
    submitMutation.mutate({
      firstName: user?.firstName || '',
      lastName:  user?.lastName || '',
      email:     user?.email || '',
      phone:     user?.phone || '',
      serviceTypeId: selectedType._id,
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

  return (
    <div style={{ borderTop: '1px solid #e5eae6', paddingTop: 16, marginTop: 4 }}>
      {/* Toggle — exact InlineLaybyePlans style */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ position: 'relative', marginTop: 2 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => handleToggle(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <div style={{
            width: 40, height: 20, borderRadius: 10,
            background: enabled ? '#1b5e35' : '#ccc',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 2, left: enabled ? 22 : 2,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔧</span>
            <span>Book a Professional</span>
          </div>
          <div style={{ fontSize: 12, color: '#76889a', marginTop: 2 }}>
            {isLoading ? 'Loading services...' : `${serviceTypes.length} service${serviceTypes.length !== 1 ? 's' : ''} available — electricians, plumbers & more`}
          </div>
        </div>
      </label>

      {/* Expanded panel */}
      {enabled && (
        <div style={{ marginTop: 14 }}>
          {submitted ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>Request submitted!</p>
              <p style={{ color: '#16a34a', fontSize: 12, marginTop: 4 }}>We'll contact you shortly to confirm your booking.</p>
              <button
                onClick={() => { setEnabled(false); setSubmitted(false); setSelectedTypeId(null); }}
                style={{ marginTop: 12, fontSize: 12, color: '#76889a', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Service Type Cards — same grid style as layby plan cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: serviceTypes.length <= 4
                  ? `repeat(${Math.min(serviceTypes.length, 4)}, 1fr)`
                  : `repeat(${Math.min(serviceTypes.length, 4)}, minmax(100px, 1fr))`,
                gap: 8,
                marginBottom: 14,
                overflowX: serviceTypes.length > 4 ? 'auto' : 'visible',
              }}>
                {serviceTypes.map((type) => {
                  const isSelected = type._id === selectedTypeId;
                  return (
                    <button
                      key={type._id}
                      type="button"
                      onClick={() => handleSelectType(type)}
                      style={{
                        padding: '12px 10px',
                        border: isSelected ? '2px solid #1b5e35' : '1px solid #e5eae6',
                        borderRadius: 8,
                        background: isSelected ? '#f0fdf4' : '#fff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        position: 'relative',
                        minWidth: serviceTypes.length > 4 ? 100 : undefined,
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: -1, right: -1,
                          background: '#1b5e35', color: '#fff',
                          fontSize: 9, padding: '2px 6px', fontWeight: 700,
                          borderBottomLeftRadius: 4, borderTopRightRadius: 6,
                        }}>
                          ✓
                        </div>
                      )}
                      {type.imageUrl ? (
                        <img src={type.imageUrl} alt={type.title} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6, margin: '0 auto 4px', display: 'block' }} />
                      ) : (
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{type.icon || '🔧'}</div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{type.title}</div>
                      <div style={{ fontSize: 10, color: '#76889a', marginTop: 3 }}>
                        {(type.serviceModes || []).map(m => MODE_LABELS[m] || m).join(' · ')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form — shown when a type is selected */}
              {selectedType && (
                <form onSubmit={handleSubmit}>
                  <div style={{ background: '#fafbfc', border: '1px solid #e5eae6', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
                      {selectedType.icon} {selectedType.title}
                    </p>

                    {/* Mode selector */}
                    {selectedType.serviceModes?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11, color: '#76889a', marginBottom: 6, fontWeight: 600 }}>What do you need?</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {selectedType.serviceModes.map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleMode(m)}
                              style={{
                                padding: '4px 10px',
                                border: selectedModes.includes(m) ? '1.5px solid #1b5e35' : '1px solid #e5eae6',
                                borderRadius: 20,
                                background: selectedModes.includes(m) ? '#f0fdf4' : '#fff',
                                color: selectedModes.includes(m) ? '#1b5e35' : '#76889a',
                                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              {MODE_LABELS[m] || m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p style={{ fontSize: 11, color: '#76889a', marginBottom: 4, fontWeight: 600 }}>Notes (optional)</p>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Describe the issue or what you need..."
                        style={{
                          width: '100%', border: '1px solid #e5eae6', borderRadius: 6,
                          padding: '6px 10px', fontSize: 12, resize: 'none',
                          boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    {/* Address */}
                    {user?.addresses?.length > 0 && (
                      <p style={{ fontSize: 10, color: '#76889a', marginTop: 6 }}>
                        📍 Using your saved address:{' '}
                        {(() => {
                          const a = user.addresses.find(x => x.isDefault) || user.addresses[0];
                          return [a?.suburb, a?.city, a?.province].filter(Boolean).join(', ');
                        })()}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitMutation.isLoading}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: '#1b5e35', color: '#fff',
                      border: 'none', borderRadius: 8,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      opacity: submitMutation.isLoading ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {submitMutation.isLoading ? 'Submitting...' : 'Request This Service'}
                  </button>
                </form>
              )}

              {/* View all link */}
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Link
                  to="/service-providers"
                  style={{ fontSize: 11, color: '#76889a', textDecoration: 'underline' }}
                >
                  View all service providers →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
