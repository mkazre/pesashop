import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { offersAPI } from '@/services/api';
import { useAuthStore, useUIStore } from '@/store';
import toast from '@/utils/toast';

/**
 * OfferCard — fully stacked vertical layout. Clean and responsive.
 * Handles contact_request / purchasable / subscription offer types.
 */
export default function OfferCard({ offer, onTaken }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [done, setDone] = useState(false);

  const takeMutation = useMutation(
    () => offersAPI.take(offer._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-offers');
        setDone(true);
        onTaken?.();
        toast.success(offer.offerType === 'contact_request'
          ? "Thanks! We'll be in touch soon."
          : `"${offer.title}" activated!`);
      },
      onError: (e) => {
        const msg = e.response?.data?.message || 'Action failed';
        if (msg.toLowerCase().includes('already')) {
          setDone(true);
          toast.success('You already have this offer');
        } else {
          toast.error(msg);
        }
      }
    }
  );

  const handleAction = () => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    if (done) return;
    takeMutation.mutate();
  };

  const ctaText = offer.ctaButtonText
    || (offer.offerType === 'contact_request' ? 'Request Info'
      : offer.offerType === 'subscription' ? 'Subscribe'
      : 'Get Offer');

  if (done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
        <div>
          <p style={{ fontWeight: 600, color: '#166534', fontSize: 13, margin: 0 }}>{offer.title}</p>
          <p style={{ fontSize: 12, color: '#15803d', margin: '2px 0 0' }}>
            {offer.offerType === 'contact_request' ? "We'll be in touch soon!" : 'Offer activated!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5eae6', borderRadius: 12, padding: '14px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#a7f3d0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5eae6'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top row: logo + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {offer.logoUrl ? (
          <img src={offer.logoUrl} alt={offer.title}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5eae6', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(27,94,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            🏷️
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {offer.title}
          </p>
          {offer.badgeText && (
            <span style={{
              display: 'inline-block', marginTop: 2,
              padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
              background: offer.badgeColor || '#3B82F6', color: '#fff',
            }}>
              {offer.badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {offer.shortDescription && (
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', lineHeight: 1.4 }}>
          {offer.shortDescription}
        </p>
      )}

      {/* Provider */}
      {offer.providerName && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px' }}>by {offer.providerName}</p>
      )}

      {/* CTA button — full width */}
      <button
        onClick={handleAction}
        disabled={takeMutation.isLoading}
        style={{
          display: 'block', width: '100%',
          padding: '9px 12px',
          background: '#1b5e35', color: '#fff',
          border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 700,
          cursor: takeMutation.isLoading ? 'not-allowed' : 'pointer',
          opacity: takeMutation.isLoading ? 0.6 : 1,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!takeMutation.isLoading) e.currentTarget.style.background = '#145226'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1b5e35'; }}
      >
        {takeMutation.isLoading ? 'Processing...' : ctaText}
      </button>
    </div>
  );
}
