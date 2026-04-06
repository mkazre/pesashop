import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── FREQUENCY / STORAGE HELPERS ─────────────────────────────────────────────

const STORAGE_KEY = 'pesa_popups_seen';

const getSeenData = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const saveSeenData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

const shouldShowForFrequency = (popupId, frequency) => {
  const seen = getSeenData();
  const record = seen[popupId];
  if (!record) return true;

  const now = Date.now();
  switch (frequency) {
    case 'always': return true;
    case 'once_per_session': return !record.session || record.session !== getSession();
    case 'once_per_day': return now - record.lastSeen > 86400000;
    case 'once_per_week': return now - record.lastSeen > 604800000;
    case 'once_per_month': return now - record.lastSeen > 2592000000;
    case 'once_ever': return !record.lastSeen;
    default: return true;
  }
};

const markSeen = (popupId) => {
  const seen = getSeenData();
  seen[popupId] = { lastSeen: Date.now(), session: getSession(), count: (seen[popupId]?.count || 0) + 1 };
  saveSeenData(seen);
};

const getSession = () => {
  let s = sessionStorage.getItem('pesa_session_id');
  if (!s) { s = Math.random().toString(36).slice(2); sessionStorage.setItem('pesa_session_id', s); }
  return s;
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

const trackEvent = (popupId, event) => {
  try { axios.post(`${API}/popups/${popupId}/analytics`, { event }).catch(() => {}); } catch {}
};

// ─── DEVICE DETECTION ────────────────────────────────────────────────────────

const getDeviceType = () => {
  const w = window.innerWidth;
  if (w <= 768) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
};

const matchesDeviceTarget = (deviceTarget, device) => {
  if (deviceTarget === 'all') return true;
  if (deviceTarget === 'desktop_only') return device === 'desktop';
  if (deviceTarget === 'tablet_only') return device === 'tablet';
  if (deviceTarget === 'mobile_only') return device === 'mobile';
  if (deviceTarget === 'desktop_and_tablet') return device !== 'mobile';
  if (deviceTarget === 'mobile_and_tablet') return device !== 'desktop';
  return true;
};

// ─── CONDITION CHECKERS ──────────────────────────────────────────────────────

const meetsConditions = (popup, context) => {
  const { conditions, display } = popup;
  if (!conditions) return true;

  const { isLoggedIn, currentUrl, cartTotal, userRole } = context;

  if (conditions.loggedIn === 'logged_in' && !isLoggedIn) return false;
  if (conditions.loggedIn === 'logged_out' && isLoggedIn) return false;

  if (conditions.cartMinValue && cartTotal < conditions.cartMinValue) return false;
  if (conditions.cartMaxValue && cartTotal > conditions.cartMaxValue) return false;

  if (conditions.urlContains?.length) {
    if (!conditions.urlContains.some(s => currentUrl.includes(s))) return false;
  }
  if (conditions.urlNotContains?.length) {
    if (conditions.urlNotContains.some(s => currentUrl.includes(s))) return false;
  }
  if (conditions.referrerContains && !document.referrer.includes(conditions.referrerContains)) return false;

  if (conditions.cookieName) {
    const cookieVal = document.cookie.split(';').find(c => c.trim().startsWith(conditions.cookieName + '='));
    if (!cookieVal) return false;
    if (conditions.cookieValue && !cookieVal.includes(conditions.cookieValue)) return false;
  }

  if (conditions.visitorType === 'new' && getSeenData()['_ever_visited']) return false;
  if (conditions.visitorType === 'returning' && !getSeenData()['_ever_visited']) return false;

  return true;
};

// ─── ANIMATION STYLES ────────────────────────────────────────────────────────

const getKeyframeCSS = () => `
  @keyframes pp-fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes pp-fade-out { from { opacity: 1 } to { opacity: 0 } }
  @keyframes pp-slide-up-in { from { opacity: 0; transform: translateY(60px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pp-slide-up-out { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(60px) } }
  @keyframes pp-slide-down-in { from { opacity: 0; transform: translateY(-60px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes pp-slide-down-out { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(-60px) } }
  @keyframes pp-slide-left-in { from { opacity: 0; transform: translateX(80px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes pp-slide-left-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(80px) } }
  @keyframes pp-slide-right-in { from { opacity: 0; transform: translateX(-80px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes pp-slide-right-out { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-80px) } }
  @keyframes pp-zoom-in { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: scale(1) } }
  @keyframes pp-zoom-out { from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.8) } }
  @keyframes pp-bounce-in { 0% { opacity: 0; transform: scale(0.3) } 50% { transform: scale(1.05) } 70% { transform: scale(0.9) } 100% { opacity: 1; transform: scale(1) } }
  @keyframes pp-flip-x-in { from { opacity: 0; transform: perspective(600px) rotateX(-30deg) } to { opacity: 1; transform: perspective(600px) rotateX(0) } }
  @keyframes pp-rotate-in { from { opacity: 0; transform: rotate(-10deg) scale(0.85) } to { opacity: 1; transform: rotate(0) scale(1) } }
  @keyframes pp-elastic-in { 0% { opacity: 0; transform: scale(0) } 55% { opacity: 1; transform: scale(1.1) } 75% { transform: scale(0.95) } 90% { transform: scale(1.02) } 100% { transform: scale(1) } }
`;

const getEntryAnim = (type, duration) => {
  const map = {
    fade: `pp-fade-in ${duration}ms ease forwards`,
    slide_up: `pp-slide-up-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    slide_down: `pp-slide-down-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    slide_left: `pp-slide-left-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    slide_right: `pp-slide-right-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    zoom_in: `pp-zoom-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    bounce: `pp-bounce-in ${duration * 1.5}ms ease forwards`,
    flip_x: `pp-flip-x-in ${duration}ms ease forwards`,
    rotate_in: `pp-rotate-in ${duration}ms cubic-bezier(0.34,1.56,0.64,1) forwards`,
    elastic: `pp-elastic-in ${duration * 1.5}ms ease forwards`,
  };
  return map[type] || map.fade;
};

const getExitAnim = (type, duration) => {
  const map = {
    fade: `pp-fade-out ${duration}ms ease forwards`,
    slide_up: `pp-slide-up-out ${duration}ms ease forwards`,
    slide_down: `pp-slide-down-out ${duration}ms ease forwards`,
    slide_left: `pp-slide-left-out ${duration}ms ease forwards`,
    slide_right: `pp-slide-right-out ${duration}ms ease forwards`,
    zoom_out: `pp-zoom-out ${duration}ms ease forwards`,
    none: 'none',
  };
  return map[type] || map.fade;
};

// ─── POSITION STYLES ─────────────────────────────────────────────────────────

const getPositionStyle = (position) => {
  const base = { position: 'fixed', zIndex: 99998 };
  switch (position) {
    case 'center': return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    case 'top_center': return { ...base, top: '32px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom_center': return { ...base, bottom: '32px', left: '50%', transform: 'translateX(-50%)' };
    case 'top_left': return { ...base, top: '24px', left: '24px' };
    case 'top_right': return { ...base, top: '24px', right: '24px' };
    case 'bottom_left': return { ...base, bottom: '24px', left: '24px' };
    case 'bottom_right': return { ...base, bottom: '24px', right: '24px' };
    case 'left_center': return { ...base, top: '50%', left: '24px', transform: 'translateY(-50%)' };
    case 'right_center': return { ...base, top: '50%', right: '24px', transform: 'translateY(-50%)' };
    case 'full_screen': return { ...base, top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', maxWidth: 'none', borderRadius: 0 };
    case 'top_bar': return { ...base, top: 0, left: 0, right: 0, width: '100%', maxWidth: 'none', borderRadius: '0 0 8px 8px' };
    case 'bottom_bar': return { ...base, bottom: 0, left: 0, right: 0, width: '100%', maxWidth: 'none', borderRadius: '8px 8px 0 0' };
    case 'left_drawer': return { ...base, top: 0, left: 0, bottom: 0, height: '100%', maxWidth: 'none', borderRadius: '0 16px 16px 0' };
    case 'right_drawer': return { ...base, top: 0, right: 0, bottom: 0, height: '100%', maxWidth: 'none', borderRadius: '16px 0 0 16px' };
    default: return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
};

// ─── BLOCK RENDERER ───────────────────────────────────────────────────────────

const BlockRenderer = ({ block, onConversion }) => {
  const { type, content = {}, styles = {} } = block;
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (type !== 'countdown') return;
    const calc = () => {
      if (content.targetDate) {
        const diff = new Date(content.targetDate) - new Date();
        return Math.max(0, Math.floor(diff / 1000));
      }
      return content.duration || 3600;
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(prev => {
      if (prev === null) return calc();
      return Math.max(0, prev - 1);
    }), 1000);
    return () => clearInterval(interval);
  }, [type, content.targetDate, content.duration]);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      onConversion && onConversion();
      setTimeout(() => setCopied(false), 2500);
    });
  };

  switch (type) {
    case 'heading':
      return createElement(content.level || 'h2', { style: styles }, content.text || '');

    case 'text':
      return <p style={styles} dangerouslySetInnerHTML={{ __html: content.text || '' }} />;

    case 'image':
      return content.url ? (
        content.link
          ? <a href={content.link} target="_blank" rel="noopener noreferrer" onClick={() => onConversion && onConversion()} style={{ display: 'block', ...styles }}><img src={content.url} alt={content.alt || ''} style={{ width: '100%', display: 'block', objectFit: content.objectFit || 'cover', borderRadius: styles.borderRadius }} /></a>
          : <img src={content.url} alt={content.alt || ''} style={{ width: '100%', display: 'block', objectFit: content.objectFit || 'cover', ...styles }} />
      ) : null;

    case 'button': {
      const handleClick = () => {
        onConversion && onConversion();
        if (content.action === 'link' && content.link) {
          if (content.target === '_blank') window.open(content.link, '_blank');
          else window.location.href = content.link;
        }
      };
      return (
        <div style={{ textAlign: styles.textAlign || 'center', marginBottom: styles.marginBottom }}>
          <button onClick={handleClick} style={{ ...styles, cursor: 'pointer', transition: 'opacity 0.2s, transform 0.1s' }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            onMouseDown={e => e.target.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.target.style.transform = 'scale(1)'}>
            {content.text || 'Button'}
          </button>
        </div>
      );
    }

    case 'input': {
      const [inputVal, setInputVal] = useState('');
      const handleSubmit = () => {
        if (inputVal) {
          onConversion && onConversion();
          setInputVal('');
        }
      };
      return (
        <div style={{ marginBottom: styles.marginBottom || '12px' }}>
          {content.label && <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>{content.label}</label>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type={content.type || 'email'} placeholder={content.placeholder || 'Enter email'} value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ flex: 1, padding: '11px 14px', borderRadius: styles.borderRadius || '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            {content.buttonText && <button onClick={handleSubmit} style={{ padding: '11px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: styles.borderRadius || '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>{content.buttonText}</button>}
          </div>
        </div>
      );
    }

    case 'coupon':
      return (
        <div style={styles}>
          {content.label && <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', fontWeight: '500', margin: '0 0 8px' }}>{content.label}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#b45309', letterSpacing: '3px', fontFamily: 'monospace' }}>{content.code || 'CODE'}</span>
            {content.showCopyBtn && (
              <button onClick={() => copyToClipboard(content.code)} style={{ padding: '5px 12px', background: copied ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      );

    case 'countdown': {
      const days = timeLeft !== null ? Math.floor(timeLeft / 86400) : 0;
      const hours = timeLeft !== null ? Math.floor((timeLeft % 86400) / 3600) : 0;
      const mins = timeLeft !== null ? Math.floor((timeLeft % 3600) / 60) : 0;
      const secs = timeLeft !== null ? timeLeft % 60 : 0;
      const seg = (n, l) => (
        <div style={{ textAlign: 'center', minWidth: '52px', background: styles.segBg || 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '8px 4px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: styles.numberColor || '#1f2937', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</div>
          <div style={{ fontSize: '10px', color: styles.labelColor || '#6b7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
        </div>
      );
      const sep = <span style={{ fontSize: '24px', fontWeight: '700', color: styles.numberColor || '#1f2937', alignSelf: 'flex-start', marginTop: '8px' }}>:</span>;
      return (
        <div style={{ textAlign: 'center', ...styles }}>
          {content.label && <p style={{ fontSize: '13px', color: '#374151', marginBottom: '12px', fontWeight: '500' }}>{content.label}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            {content.showDays && <>{seg(days, 'Days')}{sep}</>}
            {seg(hours, 'Hours')}{sep}
            {seg(mins, 'Mins')}{sep}
            {seg(secs, 'Secs')}
          </div>
        </div>
      );
    }

    case 'divider':
      return <hr style={{ border: 'none', borderTop: `${content.thickness || '1px'} ${content.style || 'solid'} ${content.color || '#e5e7eb'}`, margin: `${styles.marginTop || '16px'} 0 ${styles.marginBottom || '16px'}` }} />;

    case 'spacer':
      return <div style={{ height: content.height || '20px' }} />;

    case 'video':
      return content.url ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', ...styles }}>
          <iframe src={`${content.url}${content.autoplay ? '?autoplay=1&mute=1' : ''}${content.loop ? '&loop=1' : ''}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: styles.borderRadius || '8px', border: 'none' }} allow="autoplay; encrypted-media" allowFullScreen title="Popup video" />
        </div>
      ) : null;

    case 'html':
      return <div style={styles} dangerouslySetInnerHTML={{ __html: content.code || '' }} />;

    case 'icon_text':
      return (
        <div style={{ textAlign: styles.textAlign || 'center', marginBottom: styles.marginBottom || '16px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{content.icon || '🎁'}</div>
          {content.heading && <h4 style={{ fontSize: '16px', fontWeight: '700', color: styles.headingColor || '#1f2937', margin: '0 0 4px' }}>{content.heading}</h4>}
          {content.text && <p style={{ fontSize: '13px', color: styles.textColor || '#6b7280', margin: 0 }}>{content.text}</p>}
        </div>
      );

    default: return null;
  }
};

// createElement helper for JSX dynamic tags
const createElement = (tag, props, children) => {
  const validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
  const t = validTags.includes(tag) ? tag : 'h2';
  return React.createElement(t, props, children);
};

// ─── SINGLE POPUP DISPLAY ────────────────────────────────────────────────────

import React from 'react';

const PopupDisplay = ({ popup, onClose, onConversion }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeBtnVisible, setCloseBtnVisible] = useState(false);
  const design = popup.design || {};
  const device = getDeviceType();
  const layoutKey = (device === 'tablet' && popup.layouts?.useDesktopForTablet) ? 'desktop'
    : (device === 'mobile' && popup.layouts?.useDesktopForMobile) ? 'desktop'
    : device;
  const layout = popup.layouts?.[layoutKey] || popup.layouts?.desktop || { blocks: [], position: 'center', width: '560px', maxWidth: '90vw' };
  const duration = design.animationDuration || 400;

  useEffect(() => {
    // Small delay to trigger entry animation
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (design.closeButtonDelay && design.closeButtonDelay > 0) {
      const t = setTimeout(() => setCloseBtnVisible(true), design.closeButtonDelay * 1000);
      return () => clearTimeout(t);
    } else {
      setCloseBtnVisible(true);
    }
  }, [design.closeButtonDelay]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, design.exitAnimation === 'none' ? 0 : duration);
  };

  const posStyle = getPositionStyle(layout.position);
  const bgStyle = design.backgroundType === 'gradient'
    ? { background: design.backgroundGradient }
    : design.backgroundType === 'image' && design.backgroundImage
    ? { backgroundImage: `url(${design.backgroundImage})`, backgroundSize: design.backgroundSize || 'cover', backgroundPosition: design.backgroundPosition || 'center' }
    : { backgroundColor: design.backgroundColor || '#fff' };

  const entryAnim = getEntryAnim(design.entryAnimation || 'fade', duration);
  const exitAnim = design.exitAnimation === 'none' ? 'none' : getExitAnim(design.exitAnimation || 'fade', duration);

  const popupStyle = {
    ...posStyle,
    ...bgStyle,
    width: layout.width || '560px',
    maxWidth: layout.maxWidth || '90vw',
    borderRadius: design.borderRadius || '16px',
    border: design.border || 'none',
    boxShadow: design.boxShadow || '0 25px 60px rgba(0,0,0,0.35)',
    padding: design.padding || '40px 36px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    maxHeight: '90vh',
    animation: closing
      ? (exitAnim !== 'none' ? exitAnim : undefined)
      : (visible ? entryAnim : 'none'),
    opacity: visible ? 1 : 0,
  };

  const closeBtn = design.showCloseButton && closeBtnVisible;
  const cbPos = design.closeButtonPosition || 'top_right';
  const closeBtnStyle = {
    position: 'absolute',
    width: design.closeButtonSize || 28,
    height: design.closeButtonSize || 28,
    borderRadius: '50%',
    background: design.closeButtonBg || 'rgba(0,0,0,0.08)',
    border: 'none',
    color: design.closeButtonColor || '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: (design.closeButtonSize || 28) * 0.5,
    fontWeight: '700',
    zIndex: 1,
    transition: 'background 0.2s, transform 0.15s',
    top: cbPos.includes('inner') ? '12px' : '-16px',
    right: cbPos.includes('right') ? (cbPos.includes('inner') ? '12px' : '-16px') : 'auto',
    left: cbPos.includes('left') ? (cbPos.includes('inner') ? '12px' : '-16px') : 'auto',
  };

  return (
    <>
      {/* Overlay */}
      {design.overlayEnabled && (
        <div
          onClick={design.closeOnOverlayClick ? handleClose : undefined}
          style={{
            position: 'fixed', inset: 0, zIndex: 99997,
            backgroundColor: design.overlayColor || '#000',
            opacity: visible ? (design.overlayOpacity ?? 0.55) : 0,
            backdropFilter: design.overlayBlur ? `blur(${design.overlayBlurAmount || 4}px)` : 'none',
            transition: `opacity ${duration}ms ease`,
            cursor: design.closeOnOverlayClick ? 'pointer' : 'default',
          }}
        />
      )}

      {/* Popup */}
      <div style={popupStyle}>
        {closeBtn && (
          <button style={closeBtnStyle} onClick={handleClose}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.16)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = design.closeButtonBg || 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}>
            ×
          </button>
        )}
        {layout.blocks?.map(block => (
          <BlockRenderer
            key={block.id}
            block={{ ...block, styles: { ...block.styles, ...(device === 'mobile' && block.mobileStyles ? block.mobileStyles : {}), ...(device === 'tablet' && block.tabletStyles ? block.tabletStyles : {}) } }}
            onConversion={onConversion}
          />
        ))}
      </div>
    </>
  );
};

// ─── MAIN RENDERER ────────────────────────────────────────────────────────────

export default function PopupRenderer({ isApp = false }) {
  const location = useLocation();
  const [activePopups, setActivePopups] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const triggeredRef = useRef(new Set());
  const timersRef = useRef([]);
  const scrollListenerRef = useRef(null);
  const exitListenerRef = useRef(null);
  const inactivityRef = useRef(null);

  // Inject CSS animations once
  useEffect(() => {
    if (document.getElementById('pesa-popup-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'pesa-popup-keyframes';
    style.textContent = getKeyframeCSS();
    document.head.appendChild(style);
  }, []);

  // Mark first visit
  useEffect(() => {
    const seen = getSeenData();
    if (!seen['_ever_visited']) { seen['_ever_visited'] = true; saveSeenData(seen); }
  }, []);

  // Fetch popups on route change
  useEffect(() => {
    const pagePath = location.pathname;
    const pageType = pagePath === '/' ? 'homepage' : pagePath.split('/').filter(Boolean)[0] || 'custom';
    const fetchPopups = async () => {
      try {
        const res = await axios.get(`${API}/popups/public/active`, {
          params: { pagePath, pageType, isWeb: !isApp, isApp },
        });
        const popups = res.data?.data || [];
        const device = getDeviceType();
        const context = {
          isLoggedIn: !!localStorage.getItem('pesa_token'),
          currentUrl: window.location.href,
          cartTotal: 0,
        };
        const eligible = popups.filter(p =>
          matchesDeviceTarget(p.display?.deviceTarget || 'all', device) &&
          shouldShowForFrequency(p._id, p.display?.frequency || 'once_per_session') &&
          meetsConditions(p, context)
        );
        setupTriggers(eligible);
      } catch {}
    };
    fetchPopups();
    return () => clearTriggers();
  }, [location.pathname]);

  const clearTriggers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (scrollListenerRef.current) { window.removeEventListener('scroll', scrollListenerRef.current); scrollListenerRef.current = null; }
    if (exitListenerRef.current) { document.removeEventListener('mouseleave', exitListenerRef.current); exitListenerRef.current = null; }
    if (inactivityRef.current) { clearTimeout(inactivityRef.current); inactivityRef.current = null; }
  };

  const triggerPopup = useCallback((popup) => {
    if (triggeredRef.current.has(popup._id)) return;
    triggeredRef.current.add(popup._id);
    markSeen(popup._id);
    trackEvent(popup._id, 'impression');
    setActivePopups(prev => prev.some(p => p._id === popup._id) ? prev : [...prev, popup]);
  }, []);

  const setupTriggers = (popups) => {
    clearTriggers();
    triggeredRef.current.clear();

    popups.forEach(popup => {
      const trigger = popup.trigger || {};
      switch (trigger.type) {
        case 'immediate':
          timersRef.current.push(setTimeout(() => triggerPopup(popup), 100));
          break;
        case 'delay':
          timersRef.current.push(setTimeout(() => triggerPopup(popup), (trigger.delay || 3) * 1000));
          break;
        case 'scroll_percent': {
          const handler = () => {
            const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrolled >= (trigger.scrollPercent || 50)) triggerPopup(popup);
          };
          scrollListenerRef.current = handler;
          window.addEventListener('scroll', handler, { passive: true });
          break;
        }
        case 'exit_intent': {
          const handler = (e) => {
            if (e.clientY <= 0) triggerPopup(popup);
          };
          exitListenerRef.current = handler;
          document.addEventListener('mouseleave', handler);
          break;
        }
        case 'inactivity': {
          const resetTimer = () => {
            if (inactivityRef.current) clearTimeout(inactivityRef.current);
            inactivityRef.current = setTimeout(() => triggerPopup(popup), (trigger.inactivitySeconds || 30) * 1000);
          };
          ['mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
          resetTimer();
          break;
        }
        case 'click_element': {
          if (trigger.clickSelector) {
            const els = document.querySelectorAll(trigger.clickSelector);
            els.forEach(el => el.addEventListener('click', () => triggerPopup(popup), { once: true }));
          }
          break;
        }
        default:
          timersRef.current.push(setTimeout(() => triggerPopup(popup), 3000));
      }
    });
  };

  const handleDismiss = (popupId) => {
    setActivePopups(prev => prev.filter(p => p._id !== popupId));
    setDismissedIds(prev => new Set([...prev, popupId]));
    trackEvent(popupId, 'dismissal');
  };

  const handleConversion = (popupId) => {
    trackEvent(popupId, 'conversion');
    trackEvent(popupId, 'click');
    const popup = activePopups.find(p => p._id === popupId);
    if (popup?.goal?.closeAfterGoal) {
      setTimeout(() => handleDismiss(popupId), 400);
    }
    if (popup?.goal?.redirectAfterGoal) {
      setTimeout(() => { window.location.href = popup.goal.redirectAfterGoal; }, 600);
    }
  };

  if (activePopups.length === 0) return null;

  return (
    <>
      {activePopups.filter(p => !dismissedIds.has(p._id)).map(popup => (
        <PopupDisplay
          key={popup._id}
          popup={popup}
          onClose={() => handleDismiss(popup._id)}
          onConversion={() => handleConversion(popup._id)}
        />
      ))}
    </>
  );
}
