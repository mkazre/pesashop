import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function VideoModal({ video, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Modal container — stops click propagation so only backdrop closes */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(380px, 90vw)',
          height: 'min(674px, 90vh)',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <iframe
          src={`${video.embedUrl}?autoplay=1`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="autoplay; fullscreen"
          allowFullScreen
          title={video.description}
        />
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function TikTokVideoCard({ video }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          flexShrink: 0,
          width: 160,
          height: 285,
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          background: '#111',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        {/* Thumbnail */}
        {video.coverUrl ? (
          <img
            src={video.coverUrl}
            alt={video.description}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#222' }} />
        )}

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* View count — top-left */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 8 }}>▶</span>
          <span>{formatCount(video.stats?.plays)}</span>
        </div>

        {/* TikTok badge — top-right */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
        }}>
          TikTok
        </div>

        {/* Play button — center */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 18, marginLeft: 3 }}>▶</span>
        </div>

        {/* Creator handle — bottom */}
        <div style={{ position: 'absolute', bottom: 10, left: 8, right: 8 }}>
          <div style={{
            color: '#fff', fontSize: 11, fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            @{video.author?.handle || 'creator'}
          </div>
          {video.description && (
            <div style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 2,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {video.description}
            </div>
          )}
        </div>
      </div>

      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </>
  );
}
