import { useEffect, useRef } from 'react';
import { serviceProviderAdsAPI } from '@/services/api';

/**
 * ServiceProviderAdCard — renders a single service provider advertisement.
 * Style matches the InlineLaybyePlans card style (bordered card, brand green accent).
 * Tracks impression on mount; records click on CTA.
 */
export default function ServiceProviderAdCard({ ad }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && ad?._id) {
      tracked.current = true;
      serviceProviderAdsAPI.recordImpression(ad._id).catch(() => {});
    }
  }, [ad?._id]);

  if (!ad) return null;

  const handleClick = () => {
    serviceProviderAdsAPI.recordClick(ad._id).catch(() => {});
    if (ad.ctaUrl) window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
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
        cursor: ad.ctaUrl ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onClick={ad.ctaUrl ? handleClick : undefined}
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
      }}>
        AD
      </div>

      {/* Banner image */}
      {ad.imageUrl ? (
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
            <img src={ad.provider.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
          ) : (
            <span style={{ fontSize: 28 }}>🏢</span>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Provider logo + name */}
        {(ad.provider?.logoUrl || ad.provider?.businessName) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {ad.provider?.logoUrl && (
              <img src={ad.provider.logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5eae6', flexShrink: 0 }} />
            )}
            {ad.provider?.businessName && (
              <span style={{ fontSize: 10, color: '#76889a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.provider.businessName}</span>
            )}
          </div>
        )}

        {/* Title */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {ad.title}
        </div>

        {/* Body */}
        {ad.body && (
          <div style={{ fontSize: 11, color: '#76889a', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
            {ad.body}
          </div>
        )}

        {/* CTA */}
        {ad.ctaText && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
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
            {ad.ctaText} →
          </button>
        )}
      </div>
    </div>
  );
}
