import { useState, useEffect, useRef } from 'react';
import { serviceProviderAdsAPI } from '@/services/api';
import ServiceProviderAdModal from './ServiceProviderAdModal';

/**
 * ServiceProviderAdCard — renders a single service provider advertisement.
 * Clicking "Enquire" opens a 2-step enquiry modal instead of navigating to a URL.
 *
 * Props:
 *   ad       — ad object from API
 *   settings — ad display settings from admin (showProviderName, showBody, showImage, enquireButtonText)
 */
export default function ServiceProviderAdCard({ ad, settings = {} }) {
  const [modalOpen, setModalOpen] = useState(false);
  const tracked = useRef(false);

  const showImage = settings.showImage !== false;          // default on
  const showBody = settings.showBody !== false;            // default on
  const showProviderName = settings.showProviderName === true; // default OFF
  const enquireButtonText = settings.enquireButtonText || 'Enquire';

  useEffect(() => {
    if (!tracked.current && ad?._id) {
      tracked.current = true;
      serviceProviderAdsAPI.recordImpression(ad._id).catch(() => {});
    }
  }, [ad?._id]);

  if (!ad) return null;

  const handleEnquireClick = () => {
    serviceProviderAdsAPI.recordClick(ad._id).catch(() => {});
    setModalOpen(true);
  };

  return (
    <>
      <div
        style={{
          minWidth: 180,
          maxWidth: 220,
          flexShrink: 0,
          border: '1px solid #e5eae6',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#1b5e35';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e5eae6';
        }}
      >
        {/* Ad label */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: 9, fontWeight: 700, color: '#76889a',
          background: 'rgba(255,255,255,0.85)',
          padding: '1px 5px',
          letterSpacing: '0.05em',
          zIndex: 1,
        }}>
          AD
        </div>

        {/* Banner image */}
        {showImage && (
          ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: 90,
              background: 'linear-gradient(135deg, #1b5e35, #2d7a4f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ad.provider?.logoUrl ? (
                <img src={ad.provider.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
              ) : (
                <span style={{ fontSize: 26 }}>🏢</span>
              )}
            </div>
          )
        )}

        {/* Content */}
        <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Provider name — hidden by default, shown if admin enables */}
          {showProviderName && ad.provider?.businessName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {ad.provider?.logoUrl && (
                <img src={ad.provider.logoUrl} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5eae6', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 10, color: '#76889a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ad.provider.businessName}
              </span>
            </div>
          )}

          {/* Title */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {ad.title}
          </div>

          {/* Body */}
          {showBody && ad.body && (
            <div style={{ fontSize: 11, color: '#76889a', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
              {ad.body}
            </div>
          )}

          {/* Enquire button */}
          <button
            onClick={handleEnquireClick}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '7px 10px',
              background: '#1b5e35',
              color: '#a8ffca',
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.03em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2d7a4f'}
            onMouseLeave={e => e.currentTarget.style.background = '#1b5e35'}
          >
            {enquireButtonText}
          </button>
        </div>
      </div>

      {/* Enquiry Modal */}
      {modalOpen && (
        <ServiceProviderAdModal ad={ad} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
