import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { serviceRequestsAPI } from '@/services/api';

const STATUS_STYLES = {
  new: { label: 'New', bg: '#dbeafe', color: '#1d4ed8' },
  in_review: { label: 'In Review', bg: '#fef9c3', color: '#854d0e' },
  assigned: { label: 'Assigned', bg: '#e0f2fe', color: '#0369a1' },
  scheduled: { label: 'Scheduled', bg: '#ede9fe', color: '#6d28d9' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b' },
};

export default function MyServiceRequestsPage() {
  const { data, isLoading } = useQuery(
    'my-service-requests',
    () => serviceRequestsAPI.getMine().then(r => r.data.data || []),
    { staleTime: 2 * 60 * 1000 }
  );

  const requests = data || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>My Service Requests</h2>
        <p style={{ fontSize: 13, color: '#76889a', marginTop: 4 }}>Track your professional service bookings</p>
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link
          to="/service-providers"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#1b5e35', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          🔧 Request a Service
        </Link>
        <Link
          to="/service-providers#apply"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#fff', color: '#1b5e35',
            border: '1.5px solid #1b5e35',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          🏢 Become a Service Provider
        </Link>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #1b5e35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : requests.length === 0 ? (
        <div style={{ background: '#fafbfc', border: '1px solid #e5eae6', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>No service requests yet</p>
          <p style={{ fontSize: 13, color: '#76889a', marginBottom: 20 }}>Book a professional from a product page or the service providers page.</p>
          <Link
            to="/service-providers"
            style={{
              display: 'inline-block', padding: '10px 20px',
              background: '#1b5e35', color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Browse Services
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => {
            const st = STATUS_STYLES[req.status] || STATUS_STYLES.new;
            return (
              <div
                key={req._id}
                style={{
                  background: '#fff', border: '1px solid #e5eae6', borderRadius: 12, padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 12, color: '#76889a' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>
                      {req.serviceType?.title || 'Service Request'}
                    </p>

                    {(req.serviceModes || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {req.serviceModes.map(m => (
                          <span key={m} style={{ padding: '1px 8px', background: '#f0fdf4', color: '#166534', borderRadius: 20, fontSize: 11, border: '1px solid #bbf7d0' }}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </span>
                        ))}
                      </div>
                    )}

                    {req.description && (
                      <p style={{ fontSize: 12, color: '#76889a', margin: '4px 0 0' }}>{req.description}</p>
                    )}

                    {req.productName && (
                      <p style={{ fontSize: 11, color: '#a0aab4', marginTop: 4 }}>Product: {req.productName}</p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {req.scheduledDate && (
                      <div style={{ fontSize: 12, color: '#1b5e35', fontWeight: 600 }}>
                        📅 {new Date(req.scheduledDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                    {req.assignedProvider?.businessName && (
                      <div style={{ fontSize: 11, color: '#76889a', marginTop: 2 }}>
                        Assigned: {req.assignedProvider.businessName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply as provider CTA */}
      <div style={{ marginTop: 32, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#166534', margin: 0 }}>Are you a service professional?</p>
          <p style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>Electricians, plumbers, gardeners and more — join our platform</p>
        </div>
        <Link
          to="/service-providers#apply"
          style={{
            padding: '8px 16px', background: '#1b5e35', color: '#fff',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Apply as Provider
        </Link>
      </div>
    </div>
  );
}
