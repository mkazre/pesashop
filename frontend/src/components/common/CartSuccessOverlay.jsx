import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const resolveImg = (src) => {
  if (!src) return '';
  if (typeof src === 'object') src = src.url || src.src || '';
  if (!src || typeof src !== 'string') return '';
  return src.startsWith('http') ? src : `${API_URL}${src}`;
};

// ── Zustand store ─────────────────────────────────────────────────────────────
export const useCartSuccessOverlay = create((set) => ({
  visible: false,
  product: null,
  points: 0,
  cashValue: 0,
  coinLabel: 'PESA Coins',
  show: ({ product, points = 0, cashValue = 0, coinLabel = 'PESA Coins' }) =>
    set({ visible: true, product, points, cashValue, coinLabel }),
  hide: () => set({ visible: false, product: null, points: 0, cashValue: 0 }),
}));

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!target) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

// ── Overlay component ─────────────────────────────────────────────────────────
export default function CartSuccessOverlay() {
  const { visible, product, points, cashValue, coinLabel, hide } = useCartSuccessOverlay();
  const [animIn, setAnimIn] = useState(false);
  const displayPoints = useCountUp(visible ? points : 0, 1000);
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setAnimIn(true));
      timerRef.current = setTimeout(() => {
        setAnimIn(false);
        setTimeout(hide, 300);
      }, 2800);
    } else {
      setAnimIn(false);
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible]);

  if (!visible && !animIn) return null;

  const imageUrl = resolveImg(product?.images?.[0] || product?.image);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: `rgba(0,0,0,${animIn ? 0.45 : 0})`,
        transition: 'background-color 0.3s ease',
        pointerEvents: animIn ? 'auto' : 'none',
      }}
      onClick={hide}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '28px 24px',
          width: 300,
          maxWidth: '90vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          transform: animIn ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
          opacity: animIn ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          textAlign: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Check circle */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#22c55e', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          transform: animIn ? 'scale(1)' : 'scale(0)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
        }}>✓</div>

        {/* Product image + name */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={product?.name}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, margin: '0 auto 12px', display: 'block' }}
          />
        )}
        <p style={{ fontWeight: 700, fontSize: 15, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>
          {product?.name}
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>Added to your cart!</p>

        {/* PESA Coins block */}
        {points > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
            border: '1px solid #fcd34d',
            borderRadius: 12, padding: '12px 16px',
            transform: animIn ? 'translateY(0)' : 'translateY(10px)',
            opacity: animIn ? 1 : 0,
            transition: 'transform 0.4s ease 0.3s, opacity 0.4s ease 0.3s',
          }}>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              You're earning
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
              🪙 +{displayPoints}
            </div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>{coinLabel}</div>
            {cashValue > 0 && (
              <div style={{ fontSize: 11, color: '#a16207', marginTop: 6, paddingTop: 6, borderTop: '1px solid #fcd34d' }}>
                ≈ R{cashValue.toFixed(2)} cash value
              </div>
            )}
          </div>
        )}

        {/* Close hint */}
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 14, marginBottom: 0 }}>Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
