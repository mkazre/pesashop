import React, { useMemo } from 'react';

/**
 * Lightweight CSS-only confetti — 60 falling/rotating shards.
 * No JS animation loop, no canvas. Mount once when something celebratory happens.
 */
export default function KioskConfetti({ count = 60, colors = ['#f7bd20', '#0e604a', '#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d'] }) {
  const shards = useMemo(() => Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 2 + Math.random() * 2.5;
    const size = 8 + Math.random() * 8;
    const rotate = Math.random() * 360;
    const horizontalSwing = (Math.random() - 0.5) * 30;
    const color = colors[i % colors.length];
    return { id: i, left, delay, duration, size, rotate, horizontalSwing, color };
  }), [count, colors]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[10001] overflow-hidden">
      <style>{`
        @keyframes kiosk-confetti-fall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate3d(var(--swing, 0vw), 110vh, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {shards.map(s => (
        <span
          key={s.id}
          style={{
            position: 'absolute',
            top: '-10vh',
            left: `${s.left}vw`,
            width: `${s.size}px`,
            height: `${s.size * 0.4}px`,
            backgroundColor: s.color,
            transform: `rotate(${s.rotate}deg)`,
            animation: `kiosk-confetti-fall ${s.duration}s ease-in ${s.delay}s forwards`,
            '--swing': `${s.horizontalSwing}vw`,
          }}
        />
      ))}
    </div>
  );
}
