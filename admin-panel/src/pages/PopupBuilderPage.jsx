import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { popupsAPI } from '@/services/api';
import toast from '@/utils/toast';
import {
  IoAdd, IoTrash, IoCreate, IoCopy, IoEye, IoEyeOff, IoSave, IoClose,
  IoDesktopOutline, IoTabletPortraitOutline, IoPhonePortraitOutline,
  IoChevronUp, IoChevronDown, IoRefresh, IoCheckmarkCircle,
  IoAlertCircle, IoPauseCircle, IoLayersOutline, IoColorPaletteOutline,
  IoTimerOutline, IoGlobeOutline, IoFilterOutline, IoBarChartOutline,
  IoText, IoImage, IoLink, IoCodeSlash, IoApps, IoMenu, IoStar,
  IoArrowUp, IoArrowDown, IoExpand, IoGiftOutline, IoTimeOutline,
  IoRemove, IoPlayCircle, IoHappy, IoMegaphone, IoAnalyticsOutline,
  IoMegaphoneOutline
} from 'react-icons/io5';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: IoDesktopOutline, width: 1280 },
  { id: 'tablet', label: 'Tablet', icon: IoTabletPortraitOutline, width: 768 },
  { id: 'mobile', label: 'Mobile', icon: IoPhonePortraitOutline, width: 390 },
];

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top_center', label: 'Top Center' },
  { value: 'bottom_center', label: 'Bottom Center' },
  { value: 'top_left', label: 'Top Left' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'bottom_left', label: 'Bottom Left' },
  { value: 'bottom_right', label: 'Bottom Right' },
  { value: 'left_center', label: 'Left Center' },
  { value: 'right_center', label: 'Right Center' },
  { value: 'full_screen', label: 'Full Screen' },
  { value: 'top_bar', label: 'Top Bar (Banner)' },
  { value: 'bottom_bar', label: 'Bottom Bar (Banner)' },
  { value: 'left_drawer', label: 'Left Drawer' },
  { value: 'right_drawer', label: 'Right Drawer' },
];

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: IoText, color: '#6366f1' },
  { type: 'text', label: 'Text', icon: IoText, color: '#8b5cf6' },
  { type: 'image', label: 'Image', icon: IoImage, color: '#06b6d4' },
  { type: 'button', label: 'Button', icon: IoLink, color: '#10b981' },
  { type: 'input', label: 'Input Field', icon: IoMenu, color: '#f59e0b' },
  { type: 'coupon', label: 'Coupon Code', icon: IoGiftOutline, color: '#ef4444' },
  { type: 'countdown', label: 'Countdown', icon: IoTimeOutline, color: '#ec4899' },
  { type: 'divider', label: 'Divider', icon: IoRemove, color: '#64748b' },
  { type: 'spacer', label: 'Spacer', icon: IoExpand, color: '#94a3b8' },
  { type: 'video', label: 'Video', icon: IoPlayCircle, color: '#f97316' },
  { type: 'html', label: 'Custom HTML', icon: IoCodeSlash, color: '#14b8a6' },
  { type: 'icon_text', label: 'Icon + Text', icon: IoHappy, color: '#a855f7' },
];

const ANIMATIONS = ['fade', 'slide_up', 'slide_down', 'slide_left', 'slide_right', 'zoom_in', 'bounce', 'flip_x', 'rotate_in', 'elastic'];

const DEFAULT_POPUP = {
  name: 'New Popup',
  description: '',
  status: 'draft',
  tags: [],
  priority: 0,
  layouts: {
    desktop: { width: '560px', maxWidth: '90vw', position: 'center', blocks: [] },
    tablet: { width: '480px', maxWidth: '90vw', position: 'center', blocks: [] },
    mobile: { width: '100%', maxWidth: '95vw', position: 'bottom_center', blocks: [] },
    useDesktopForTablet: true,
    useDesktopForMobile: false,
  },
  design: {
    backgroundColor: '#ffffff',
    backgroundType: 'color',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundImage: '',
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
    padding: '40px 36px',
    overlayEnabled: true,
    overlayColor: '#000000',
    overlayOpacity: 0.55,
    overlayBlur: false,
    overlayBlurAmount: 4,
    closeOnOverlayClick: true,
    showCloseButton: true,
    closeButtonPosition: 'top_right',
    closeButtonDelay: 0,
    closeButtonColor: '#888888',
    closeButtonBg: 'rgba(0,0,0,0.08)',
    closeButtonSize: 28,
    entryAnimation: 'fade',
    exitAnimation: 'fade',
    animationDuration: 400,
  },
  trigger: {
    type: 'delay',
    delay: 3,
    scrollPercent: 50,
    clickSelector: '',
    inactivitySeconds: 30,
  },
  display: {
    showOnWeb: true,
    showOnApp: false,
    deviceTarget: 'all',
    pageTarget: 'all_pages',
    pagePaths: [],
    excludedPaths: [],
    frequency: 'once_per_session',
    maxImpressions: 0,
    startDate: '',
    endDate: '',
  },
  conditions: {
    loggedIn: 'any',
    userRoles: [],
    visitorType: 'any',
    cartMinValue: '',
    cartMaxValue: '',
    urlContains: [],
    urlNotContains: [],
    referrerContains: '',
    cookieName: '',
    cookieValue: '',
  },
  goal: {
    type: 'none',
    goalSelector: '',
    goalUrl: '',
    successMessage: 'Thank you!',
    closeAfterGoal: true,
    redirectAfterGoal: '',
  },
};

const DEFAULT_BLOCK_CONTENT = {
  heading: { text: 'Your Headline Here', level: 'h2' },
  text: { text: 'Add your message here. Make it compelling and clear.' },
  image: { url: '', alt: '', link: '', objectFit: 'cover' },
  button: { text: 'Shop Now', link: '/', action: 'link', variant: 'primary', target: '_self' },
  input: { placeholder: 'Enter your email', type: 'email', name: 'email', label: '', buttonText: 'Subscribe' },
  coupon: { code: 'SAVE10', label: 'Use code at checkout', showCopyBtn: true },
  countdown: { targetDate: '', duration: 3600, label: 'Offer ends in:', showDays: true },
  divider: { color: '#e5e7eb', thickness: '1px', style: 'solid' },
  spacer: { height: '20px' },
  video: { url: '', autoplay: false, muted: true, loop: false },
  html: { code: '<p>Custom HTML</p>' },
  icon_text: { icon: '🎁', heading: 'Special Offer', text: 'Limited time deal' },
};

const DEFAULT_BLOCK_STYLES = {
  heading: { textAlign: 'center', color: '#1a1a2e', fontSize: '28px', fontWeight: '700', lineHeight: '1.25', letterSpacing: '-0.5px', marginBottom: '12px' },
  text: { textAlign: 'center', color: '#4b5563', fontSize: '15px', lineHeight: '1.65', marginBottom: '20px' },
  image: { width: '100%', borderRadius: '8px', marginBottom: '20px' },
  button: { display: 'block', width: 'auto', textAlign: 'center', backgroundColor: '#6366f1', color: '#ffffff', fontSize: '15px', fontWeight: '600', padding: '14px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '8px', marginLeft: 'auto', marginRight: 'auto' },
  input: { width: '100%', marginBottom: '12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', padding: '12px 16px', fontSize: '14px' },
  coupon: { textAlign: 'center', backgroundColor: '#fef3c7', border: '2px dashed #f59e0b', borderRadius: '10px', padding: '16px', marginBottom: '12px' },
  countdown: { textAlign: 'center', marginBottom: '20px' },
  divider: { marginTop: '16px', marginBottom: '16px' },
  spacer: {},
  video: { width: '100%', borderRadius: '8px', marginBottom: '16px' },
  html: { marginBottom: '16px' },
  icon_text: { textAlign: 'center', marginBottom: '16px' },
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 10);

const getPopupBg = (design) => {
  if (design.backgroundType === 'gradient') return design.backgroundGradient;
  if (design.backgroundType === 'image' && design.backgroundImage) return `url(${design.backgroundImage})`;
  return design.backgroundColor;
};

const getPopupBgStyle = (design) => {
  if (design.backgroundType === 'gradient') return { background: design.backgroundGradient };
  if (design.backgroundType === 'image' && design.backgroundImage) return { backgroundImage: `url(${design.backgroundImage})`, backgroundSize: design.backgroundSize || 'cover', backgroundPosition: design.backgroundPosition || 'center' };
  return { backgroundColor: design.backgroundColor };
};

// ─── BLOCK RENDERER (shared by preview + frontend) ───────────────────────────

const BlockRenderer = ({ block, isPreview }) => {
  const { type, content = {}, styles = {} } = block;
  const base = { ...DEFAULT_BLOCK_STYLES[type], ...styles };

  switch (type) {
    case 'heading':
      return React.createElement(content.level || 'h2', { style: base }, content.text || 'Heading');

    case 'text':
      return <p style={base} dangerouslySetInnerHTML={{ __html: content.text || '' }} />;

    case 'image':
      return content.url ? (
        <div style={{ marginBottom: base.marginBottom }}>
          <img src={content.url} alt={content.alt || ''} style={{ width: base.width || '100%', borderRadius: base.borderRadius, display: 'block', maxWidth: '100%', objectFit: content.objectFit || 'cover' }} />
        </div>
      ) : (
        <div style={{ ...base, height: '120px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: base.borderRadius || '8px', color: '#9ca3af', fontSize: '13px', border: '2px dashed #e5e7eb' }}>
          📷 No image set
        </div>
      );

    case 'button': {
      const variants = {
        primary: { backgroundColor: base.backgroundColor || '#6366f1', color: base.color || '#fff', border: 'none' },
        secondary: { backgroundColor: '#f3f4f6', color: '#1f2937', border: 'none' },
        outline: { backgroundColor: 'transparent', color: base.backgroundColor || '#6366f1', border: `2px solid ${base.backgroundColor || '#6366f1'}` },
        ghost: { backgroundColor: 'transparent', color: base.color || '#6366f1', border: 'none', textDecoration: 'underline' },
        danger: { backgroundColor: '#ef4444', color: '#fff', border: 'none' },
      };
      const vStyle = variants[content.variant] || variants.primary;
      return (
        <div style={{ textAlign: base.textAlign || 'center', marginBottom: base.marginBottom }}>
          <button style={{ ...base, ...vStyle, padding: base.padding || '14px 32px', borderRadius: base.borderRadius || '10px', fontWeight: base.fontWeight || '600', fontSize: base.fontSize || '15px', cursor: 'pointer', display: 'inline-block', transition: 'opacity 0.2s' }}>
            {content.text || 'Button'}
          </button>
        </div>
      );
    }

    case 'input':
      return (
        <div style={{ ...base, marginBottom: base.marginBottom }}>
          {content.label && <label style={{ display: 'block', fontSize: '13px', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>{content.label}</label>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type={content.type || 'email'} placeholder={content.placeholder || 'Enter your email'} style={{ flex: 1, padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none' }} readOnly={isPreview} />
            {content.buttonText && <button style={{ padding: '11px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>{content.buttonText}</button>}
          </div>
        </div>
      );

    case 'coupon':
      return (
        <div style={{ ...DEFAULT_BLOCK_STYLES.coupon, ...styles }}>
          {content.label && <p style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', fontWeight: '500' }}>{content.label}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#b45309', letterSpacing: '3px', fontFamily: 'monospace' }}>{content.code || 'CODE'}</span>
            {content.showCopyBtn && <button style={{ padding: '4px 10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Copy</button>}
          </div>
        </div>
      );

    case 'countdown': {
      const seg = (n, l) => (
        <div style={{ textAlign: 'center', minWidth: '48px' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: styles.numberColor || '#1f2937', lineHeight: 1 }}>{String(n).padStart(2, '0')}</div>
          <div style={{ fontSize: '10px', color: styles.labelColor || '#6b7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
        </div>
      );
      return (
        <div style={{ ...DEFAULT_BLOCK_STYLES.countdown, ...styles }}>
          {content.label && <p style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', fontWeight: '500' }}>{content.label}</p>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
            {content.showDays && <>{seg(0, 'Days')}<span style={{ fontSize: '24px', fontWeight: '700', color: '#d1d5db' }}>:</span></>}
            {seg(0, 'Hours')}<span style={{ fontSize: '24px', fontWeight: '700', color: '#d1d5db' }}>:</span>
            {seg(0, 'Mins')}<span style={{ fontSize: '24px', fontWeight: '700', color: '#d1d5db' }}>:</span>
            {seg(0, 'Secs')}
          </div>
        </div>
      );
    }

    case 'divider':
      return <hr style={{ border: 'none', borderTop: `${content.thickness || '1px'} ${content.style || 'solid'} ${content.color || '#e5e7eb'}`, marginTop: base.marginTop || '16px', marginBottom: base.marginBottom || '16px' }} />;

    case 'spacer':
      return <div style={{ height: content.height || '20px' }} />;

    case 'video':
      return content.url ? (
        <div style={{ ...base, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe src={content.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: base.borderRadius || '8px', border: 'none' }} allow="autoplay; encrypted-media" allowFullScreen title="Popup video" />
        </div>
      ) : (
        <div style={{ ...base, height: '140px', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#9ca3af' }}>
          🎬 No video URL set
        </div>
      );

    case 'html':
      return <div style={base} dangerouslySetInnerHTML={{ __html: content.code || '' }} />;

    case 'icon_text':
      return (
        <div style={{ ...DEFAULT_BLOCK_STYLES.icon_text, ...styles }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{content.icon || '🎁'}</div>
          {content.heading && <h4 style={{ fontSize: '16px', fontWeight: '700', color: styles.headingColor || '#1f2937', marginBottom: '4px' }}>{content.heading}</h4>}
          {content.text && <p style={{ fontSize: '13px', color: styles.textColor || '#6b7280' }}>{content.text}</p>}
        </div>
      );

    default:
      return <div style={{ padding: '8px', color: '#aaa', fontSize: '12px', textAlign: 'center' }}>[{type}]</div>;
  }
};

// ─── POPUP PREVIEW CANVAS ─────────────────────────────────────────────────────

const PopupPreview = ({ popup, device, onBlockClick, selectedBlockId }) => {
  if (!popup) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', flexDirection: 'column', gap: '12px' }}>
      <IoMegaphone size={48} style={{ opacity: 0.3 }} />
      <span>Select or create a popup to preview</span>
    </div>
  );

  const useTabletDesktop = popup.layouts?.useDesktopForTablet;
  const useMobileDesktop = popup.layouts?.useDesktopForMobile;
  const layoutKey = (device === 'tablet' && useTabletDesktop) ? 'desktop' : (device === 'mobile' && useMobileDesktop) ? 'desktop' : device;
  const layout = popup.layouts?.[layoutKey] || popup.layouts?.desktop || { blocks: [], position: 'center', width: '560px' };
  const design = popup.design || DEFAULT_POPUP.design;

  const positionStyles = {
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    top_center: { top: '32px', left: '50%', transform: 'translateX(-50%)' },
    bottom_center: { bottom: '32px', left: '50%', transform: 'translateX(-50%)' },
    top_left: { top: '32px', left: '32px' },
    top_right: { top: '32px', right: '32px' },
    bottom_left: { bottom: '32px', left: '32px' },
    bottom_right: { bottom: '32px', right: '32px' },
    left_center: { top: '50%', left: '16px', transform: 'translateY(-50%)' },
    right_center: { top: '50%', right: '16px', transform: 'translateY(-50%)' },
    full_screen: { inset: 0, borderRadius: '0 !important' },
    top_bar: { top: 0, left: 0, right: 0, borderRadius: '0 0 8px 8px !important' },
    bottom_bar: { bottom: 0, left: 0, right: 0, borderRadius: '8px 8px 0 0 !important' },
    left_drawer: { top: 0, left: 0, bottom: 0, borderRadius: '0 16px 16px 0' },
    right_drawer: { top: 0, right: 0, bottom: 0, borderRadius: '16px 0 0 16px' },
  };
  const posStyle = positionStyles[layout.position] || positionStyles.center;

  const devWidths = { desktop: 1280, tablet: 768, mobile: 390 };
  const devW = devWidths[device];
  const containerW = Math.min(devW, 680);
  const scale = containerW / devW;

  return (
    <div style={{ position: 'relative', width: containerW, height: Math.round(devW * (device === 'mobile' ? 1.78 : device === 'tablet' ? 1.33 : 0.625) * scale), margin: '0 auto', overflow: 'hidden', border: '2px solid #e2e8f0', borderRadius: '12px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)' }}>
      {/* Simulated page content behind */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', opacity: 0.7 }}>
        <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, background: '#6366f1', borderRadius: '4px' }} />
          <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4 }} />
          <div style={{ width: 48, height: 8, background: '#e2e8f0', borderRadius: 4 }} />
        </div>
        {[60, 80, 65, 90].map((w, i) => <div key={i} style={{ height: 8, background: '#e2e8f0', borderRadius: 4, margin: '10px 16px', width: `${w}%`, opacity: 0.6 }} />)}
      </div>

      {/* Overlay */}
      {design.overlayEnabled && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: design.overlayColor, opacity: design.overlayOpacity, backdropFilter: design.overlayBlur ? `blur(${design.overlayBlurAmount || 4}px)` : 'none', zIndex: 1 }} />
      )}

      {/* Popup */}
      <div style={{ position: 'absolute', ...posStyle, width: ['top_bar', 'bottom_bar', 'full_screen'].includes(layout.position) ? '100%' : layout.width, maxWidth: layout.maxWidth, zIndex: 2, ...getPopupBgStyle(design), borderRadius: design.borderRadius, border: design.border, boxShadow: design.boxShadow, padding: design.padding, boxSizing: 'border-box', overflowY: 'auto', maxHeight: device === 'mobile' ? '85%' : '80%' }}>
        {/* Close button */}
        {design.showCloseButton && (
          <button style={{ position: 'absolute', top: design.closeButtonPosition?.includes('inner') ? '12px' : '-16px', right: design.closeButtonPosition?.includes('right') ? (design.closeButtonPosition?.includes('inner') ? '12px' : '-16px') : 'auto', left: design.closeButtonPosition?.includes('left') ? (design.closeButtonPosition?.includes('inner') ? '12px' : '-16px') : 'auto', width: design.closeButtonSize, height: design.closeButtonSize, borderRadius: '50%', background: design.closeButtonBg, border: 'none', color: design.closeButtonColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: design.closeButtonSize * 0.5, fontWeight: '700' }}>×</button>
        )}

        {/* Blocks */}
        {layout.blocks?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <IoApps size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: '13px' }}>Add blocks from the panel →</p>
          </div>
        ) : (
          layout.blocks.map((block) => (
            <div key={block.id} onClick={() => onBlockClick && onBlockClick(block.id)} style={{ cursor: onBlockClick ? 'pointer' : 'default', outline: selectedBlockId === block.id ? '2px solid #6366f1' : 'none', outlineOffset: '2px', borderRadius: '4px', transition: 'outline 0.15s' }}>
              <BlockRenderer block={block} isPreview />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── BLOCK EDITOR PANEL ───────────────────────────────────────────────────────

const BlockEditor = ({ block, onChange, onClose }) => {
  if (!block) return null;
  const { type, content = {}, styles = {} } = block;
  const update = (key, val) => onChange({ ...block, content: { ...content, [key]: val } });
  const updateStyle = (key, val) => onChange({ ...block, styles: { ...styles, [key]: val } });
  const inp = (label, cKey, placeholder = '') => (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input value={content[cKey] || ''} onChange={e => update(cKey, e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );
  const styleInp = (label, sKey, placeholder = '') => (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>{label}</label>
      <input value={styles[sKey] || ''} onChange={e => updateStyle(sKey, e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '6px 9px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }} />
    </div>
  );
  const colorInp = (label, sKey) => (
    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="color" value={styles[sKey] || '#000000'} onChange={e => updateStyle(sKey, e.target.value)} style={{ width: 32, height: 32, border: '1.5px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: 2 }} />
      <label style={{ fontSize: '12px', color: '#374151' }}>{label}</label>
    </div>
  );
  const contentColorInp = (label, cKey) => (
    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="color" value={content[cKey] || '#000000'} onChange={e => update(cKey, e.target.value)} style={{ width: 32, height: 32, border: '1.5px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: 2 }} />
      <label style={{ fontSize: '12px', color: '#374151' }}>{label}</label>
    </div>
  );
  const sel = (label, cKey, options) => (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select value={content[cKey] || ''} onChange={e => update(cKey, e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
  const styleSel = (label, sKey, options) => (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>{label}</label>
      <select value={styles[sKey] || ''} onChange={e => updateStyle(sKey, e.target.value)} style={{ width: '100%', padding: '6px 9px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937', textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')} Settings</span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px', lineHeight: 1, padding: 2 }}>×</button>
      </div>

      {/* Content section */}
      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Content</div>
        {type === 'heading' && <>
          {inp('Heading Text', 'text', 'Your headline...')}
          {sel('Level', 'level', [{ value: 'h1', label: 'H1 - Large' }, { value: 'h2', label: 'H2 - Medium' }, { value: 'h3', label: 'H3 - Small' }, { value: 'h4', label: 'H4' }, { value: 'p', label: 'Paragraph' }])}
        </>}
        {type === 'text' && <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Text Content</label><textarea value={content.text || ''} onChange={e => update('text', e.target.value)} rows={4} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }} /></div>}
        {type === 'image' && <>{inp('Image URL', 'url', 'https://...')}{inp('Alt Text', 'alt', 'Image description')}{inp('Link URL (optional)', 'link', 'https://...')}{sel('Fit', 'objectFit', [{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }])}</>}
        {type === 'button' && <>{inp('Button Text', 'text', 'Click Me')}{inp('Link / URL', 'link', '/')}{sel('Action', 'action', [{ value: 'link', label: 'Open Link' }, { value: 'close', label: 'Close Popup' }, { value: 'copy_coupon', label: 'Copy Coupon' }, { value: 'form_submit', label: 'Submit Form' }])}{sel('Variant', 'variant', [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }, { value: 'ghost', label: 'Ghost' }, { value: 'danger', label: 'Danger' }])}{sel('Open In', 'target', [{ value: '_self', label: 'Same Tab' }, { value: '_blank', label: 'New Tab' }])}</>}
        {type === 'input' && <>{inp('Placeholder', 'placeholder', 'Enter your email')}{sel('Input Type', 'type', [{ value: 'email', label: 'Email' }, { value: 'text', label: 'Text' }, { value: 'phone', label: 'Phone' }, { value: 'number', label: 'Number' }])}{inp('Label (optional)', 'label', 'Your label')}{inp('Button Text', 'buttonText', 'Subscribe')}</>}
        {type === 'coupon' && <>{inp('Coupon Code', 'code', 'SAVE10')}{inp('Label', 'label', 'Use code at checkout')}<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><input type="checkbox" checked={!!content.showCopyBtn} onChange={e => update('showCopyBtn', e.target.checked)} /><label style={{ fontSize: '13px' }}>Show Copy Button</label></div></>}
        {type === 'countdown' && <>{inp('Label', 'label', 'Offer ends in:')}<div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Target Date</label><input type="datetime-local" value={content.targetDate || ''} onChange={e => update('targetDate', e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }} /></div><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={!!content.showDays} onChange={e => update('showDays', e.target.checked)} /><label style={{ fontSize: '13px' }}>Show Days</label></div></>}
        {type === 'divider' && <>{inp('Color', 'color', '#e5e7eb')}{inp('Thickness', 'thickness', '1px')}{sel('Style', 'style', [{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }])}</>}
        {type === 'spacer' && inp('Height', 'height', '20px')}
        {type === 'video' && <>{inp('Video Embed URL', 'url', 'https://www.youtube.com/embed/...')}<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>{[['Autoplay', 'autoplay'], ['Muted', 'muted'], ['Loop', 'loop']].map(([l, k]) => <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}><input type="checkbox" checked={!!content[k]} onChange={e => update(k, e.target.checked)} />{l}</label>)}</div></>}
        {type === 'html' && <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>HTML Code</label><textarea value={content.code || ''} onChange={e => update('code', e.target.value)} rows={5} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical' }} /></div>}
        {type === 'icon_text' && <>{inp('Icon / Emoji', 'icon', '🎁')}{inp('Heading', 'heading', 'Special Offer')}{inp('Text', 'text', 'Limited time deal')}</>}
      </div>

      {/* Style section */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Styles</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px' }}>
          {type === 'heading' && <>{colorInp('Text Color', 'color')}{styleSel('Align', 'textAlign', [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }])}{styleInp('Font Size', 'fontSize', '28px')}{styleInp('Font Weight', 'fontWeight', '700')}{styleInp('Letter Spacing', 'letterSpacing', '-0.5px')}{styleInp('Margin Bottom', 'marginBottom', '12px')}</>}
          {type === 'text' && <>{colorInp('Text Color', 'color')}{styleSel('Align', 'textAlign', [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }])}{styleInp('Font Size', 'fontSize', '15px')}{styleInp('Line Height', 'lineHeight', '1.65')}{styleInp('Margin Bottom', 'marginBottom', '20px')}</>}
          {type === 'button' && <>{colorInp('Button Color', 'backgroundColor')}{colorInp('Text Color', 'color')}{styleInp('Font Size', 'fontSize', '15px')}{styleInp('Padding', 'padding', '14px 32px')}{styleInp('Border Radius', 'borderRadius', '10px')}{styleInp('Margin Bottom', 'marginBottom', '8px')}</>}
          {type === 'coupon' && <>{colorInp('Bg Color', 'backgroundColor')}{colorInp('Border Color', 'borderColor')}{styleInp('Border Radius', 'borderRadius', '10px')}{styleInp('Padding', 'padding', '16px')}</>}
          {type === 'countdown' && <>{colorInp('Number Color', 'numberColor')}{colorInp('Label Color', 'labelColor')}{styleInp('Margin Bottom', 'marginBottom', '20px')}</>}
          {(type === 'image' || type === 'video') && <>{styleInp('Width', 'width', '100%')}{styleInp('Border Radius', 'borderRadius', '8px')}{styleInp('Margin Bottom', 'marginBottom', '16px')}</>}
          {(type === 'divider' || type === 'spacer') && <>{styleInp('Margin Top', 'marginTop', '16px')}{styleInp('Margin Bottom', 'marginBottom', '16px')}</>}
          {type === 'icon_text' && <>{colorInp('Heading Color', 'headingColor')}{colorInp('Text Color', 'textColor')}{styleSel('Align', 'textAlign', [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }])}{styleInp('Margin Bottom', 'marginBottom', '16px')}</>}
          {type === 'input' && <>{styleInp('Border Radius', 'borderRadius', '8px')}{styleInp('Font Size', 'fontSize', '14px')}{styleInp('Margin Bottom', 'marginBottom', '12px')}</>}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PopupBuilderPage() {
  const queryClient = useQueryClient();
  const [activeDevice, setActiveDevice] = useState('desktop');
  const [activeTab, setActiveTab] = useState('blocks');
  const [editingPopup, setEditingPopup] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [addingBlockType, setAddingBlockType] = useState(null);

  const { data: listData, isLoading } = useQuery('popups', () => popupsAPI.getAll());
  const popups = listData?.data?.data || [];

  const createMutation = useMutation((data) => popupsAPI.create(data), {
    onSuccess: (res) => {
      queryClient.invalidateQueries('popups');
      toast.success('Popup created');
      setShowNewModal(false);
      setNewName('');
      loadPopup(res.data.data._id);
    },
    onError: () => toast.error('Failed to create popup'),
  });

  const saveMutation = useMutation(({ id, data }) => popupsAPI.update(id, data), {
    onSuccess: () => { queryClient.invalidateQueries('popups'); setIsDirty(false); toast.success('Popup saved'); },
    onError: () => toast.error('Failed to save popup'),
  });

  const deleteMutation = useMutation((id) => popupsAPI.delete(id), {
    onSuccess: () => { queryClient.invalidateQueries('popups'); setEditingPopup(null); toast.success('Popup deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const statusMutation = useMutation(({ id, status }) => popupsAPI.setStatus(id, status), {
    onSuccess: () => { queryClient.invalidateQueries('popups'); toast.success('Status updated'); },
  });

  const duplicateMutation = useMutation((id) => popupsAPI.duplicate(id), {
    onSuccess: (res) => { queryClient.invalidateQueries('popups'); toast.success('Duplicated'); loadPopup(res.data.data._id); },
  });

  const loadPopup = async (id) => {
    try {
      const res = await popupsAPI.getOne(id);
      setEditingPopup(res.data.data);
      setIsDirty(false);
      setSelectedBlockId(null);
      setActiveTab('blocks');
    } catch { toast.error('Failed to load popup'); }
  };

  const updatePopup = (path, value) => {
    setEditingPopup(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setIsDirty(true);
  };

  const getLayoutKey = () => {
    if (activeDevice === 'tablet' && editingPopup?.layouts?.useDesktopForTablet) return 'desktop';
    if (activeDevice === 'mobile' && editingPopup?.layouts?.useDesktopForMobile) return 'desktop';
    return activeDevice;
  };

  const getBlocks = () => editingPopup?.layouts?.[getLayoutKey()]?.blocks || [];

  const setBlocks = (blocks) => updatePopup(`layouts.${getLayoutKey()}.blocks`, blocks);

  const addBlock = (type) => {
    const block = { id: genId(), type, content: { ...DEFAULT_BLOCK_CONTENT[type] }, styles: { ...DEFAULT_BLOCK_STYLES[type] } };
    setBlocks([...getBlocks(), block]);
    setSelectedBlockId(block.id);
    setAddingBlockType(null);
  };

  const updateBlock = (updated) => {
    setBlocks(getBlocks().map(b => b.id === updated.id ? updated : b));
    setIsDirty(true);
  };

  const deleteBlock = (id) => {
    setBlocks(getBlocks().filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
    setIsDirty(true);
  };

  const moveBlock = (id, dir) => {
    const blocks = [...getBlocks()];
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === 'up' && idx > 0) { [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]]; }
    else if (dir === 'down' && idx < blocks.length - 1) { [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]]; }
    setBlocks(blocks);
  };

  const handleSave = () => {
    if (!editingPopup) return;
    saveMutation.mutate({ id: editingPopup._id, data: editingPopup });
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error('Please enter a popup name'); return; }
    createMutation.mutate({ ...DEFAULT_POPUP, name: newName.trim() });
  };

  const selectedBlock = getBlocks().find(b => b.id === selectedBlockId) || null;
  const filteredPopups = popups.filter(p => p.name?.toLowerCase().includes(searchQ.toLowerCase()));

  const statusColor = { draft: '#94a3b8', active: '#10b981', paused: '#f59e0b' };
  const statusIcon = { draft: IoLayersOutline, active: IoCheckmarkCircle, paused: IoPauseCircle };

  // Setting control helpers
  const PanelField = ({ label, children }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  );
  const Inp = ({ path, placeholder, type = 'text' }) => (
    <input type={type} value={path.split('.').reduce((o, k) => o?.[k], editingPopup) ?? ''} onChange={e => updatePopup(path, type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
  );
  const Sel = ({ path, options }) => (
    <select value={path.split('.').reduce((o, k) => o?.[k], editingPopup) ?? ''} onChange={e => updatePopup(path, e.target.value)} style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  const Chk = ({ path, label }) => {
    const val = path.split('.').reduce((o, k) => o?.[k], editingPopup);
    return <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', marginBottom: '8px' }}><input type="checkbox" checked={!!val} onChange={e => updatePopup(path, e.target.checked)} style={{ width: 16, height: 16 }} />{label}</label>;
  };
  const ColorInp = ({ path, label }) => {
    const val = path.split('.').reduce((o, k) => o?.[k], editingPopup) || '#000000';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input type="color" value={val} onChange={e => updatePopup(path, e.target.value)} style={{ width: 36, height: 36, border: '1.5px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', padding: 3 }} />
        <div style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{label} <span style={{ fontSize: '11px', color: '#9ca3af' }}>{val}</span></div>
      </div>
    );
  };

  const tabStyle = (t) => ({
    padding: '6px 10px', border: 'none', background: activeTab === t ? '#6366f1' : 'transparent',
    color: activeTab === t ? '#fff' : '#64748b', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
  });
  const TABS = [
    { id: 'blocks', label: 'Blocks', icon: IoApps },
    { id: 'design', label: 'Design', icon: IoColorPaletteOutline },
    { id: 'trigger', label: 'Trigger', icon: IoTimerOutline },
    { id: 'display', label: 'Display', icon: IoGlobeOutline },
    { id: 'conditions', label: 'Conditions', icon: IoFilterOutline },
    { id: 'analytics', label: 'Analytics', icon: IoBarChartOutline },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f8fafc', overflow: 'hidden' }}>

      {/* ── LEFT: Popup List ─────────────────────────────────── */}
      <div style={{ width: 260, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              <IoMegaphone style={{ verticalAlign: 'middle', marginRight: 6 }} />Popups
            </h2>
            <button onClick={() => setShowNewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              <IoAdd size={14} /> New
            </button>
          </div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search popups..." style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '13px' }}>Loading...</div>
          ) : filteredPopups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '13px' }}>
              <IoMegaphone size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              No popups yet.<br />Create your first one!
            </div>
          ) : filteredPopups.map(p => {
            const StatusIcon = statusIcon[p.status] || IoAlertCircle;
            const isSelected = editingPopup?._id === p._id;
            return (
              <div key={p._id} onClick={() => loadPopup(p._id)} style={{ padding: '10px 12px', borderRadius: '9px', marginBottom: '4px', background: isSelected ? '#ede9fe' : 'transparent', border: isSelected ? '1.5px solid #a78bfa' : '1.5px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <StatusIcon size={12} color={statusColor[p.status]} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? '#4c1d95' : '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', background: statusColor[p.status] + '22', color: statusColor[p.status], padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>{p.status}</span>
                  {p.display?.pageTarget && <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px' }}>{p.display.pageTarget.replace(/_/g, ' ')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTER: Preview ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Device switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {DEVICES.map(d => {
              const Icon = d.icon;
              return (
                <button key={d.id} onClick={() => setActiveDevice(d.id)} title={d.label} style={{ padding: '5px 10px', border: 'none', background: activeDevice === d.id ? '#fff' : 'transparent', borderRadius: '6px', cursor: 'pointer', color: activeDevice === d.id ? '#6366f1' : '#64748b', boxShadow: activeDevice === d.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' }}>
                  <Icon size={15} />{d.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {editingPopup && <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editingPopup.name}</span>}
            {isDirty && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600', background: '#fef3c7', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>Unsaved</span>}
          </div>

          {editingPopup && <>
            <select value={editingPopup.status} onChange={e => { updatePopup('status', e.target.value); }} style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: statusColor[editingPopup.status], cursor: 'pointer' }}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <button onClick={() => duplicateMutation.mutate(editingPopup._id)} title="Duplicate" style={{ padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
              <IoCopy size={14} />
            </button>
            <button onClick={() => { if (confirm('Delete this popup?')) deleteMutation.mutate(editingPopup._id); }} title="Delete" style={{ padding: '6px 10px', border: '1.5px solid #fee2e2', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: '13px' }}>
              <IoTrash size={14} />
            </button>
            <button onClick={handleSave} disabled={saveMutation.isLoading} style={{ padding: '7px 16px', background: isDirty ? '#6366f1' : '#e0e7ff', color: isDirty ? '#fff' : '#6366f1', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}>
              <IoSave size={14} />{saveMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </>}
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #f0f4ff 0%, #f0fdf4 100%)' }}>
          <PopupPreview popup={editingPopup} device={activeDevice} onBlockClick={setSelectedBlockId} selectedBlockId={selectedBlockId} />
        </div>
      </div>

      {/* ── RIGHT: Settings Panel ─────────────────────────────── */}
      <div style={{ width: 360, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        {!editingPopup ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#94a3b8', padding: '32px' }}>
            <IoCreate size={36} style={{ opacity: 0.4 }} />
            <p style={{ textAlign: 'center', fontSize: '13px', lineHeight: 1.6 }}>Select a popup from the list or create a new one to start editing.</p>
            <button onClick={() => setShowNewModal(true)} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
              <IoAdd size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Create Popup
            </button>
          </div>
        ) : <>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '3px', padding: '10px 10px 0', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', background: '#fafafa' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}><Icon size={12} />{t.label}</button>;
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>

            {/* ── BLOCKS TAB ── */}
            {activeTab === 'blocks' && <>
              {/* Layout selector for current device */}
              {activeDevice !== 'desktop' && (
                <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px' }}>
                  <Chk path={`layouts.useDesktopFor${activeDevice.charAt(0).toUpperCase() + activeDevice.slice(1)}`} label={`Use desktop layout for ${activeDevice}`} />
                </div>
              )}
              <PanelField label="Position">
                <select value={editingPopup?.layouts?.[getLayoutKey()]?.position || 'center'} onChange={e => updatePopup(`layouts.${getLayoutKey()}.position`, e.target.value)} style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}>
                  {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </PanelField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Width</label>
                  <input value={editingPopup?.layouts?.[getLayoutKey()]?.width || ''} onChange={e => updatePopup(`layouts.${getLayoutKey()}.width`, e.target.value)} placeholder="560px" style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Width</label>
                  <input value={editingPopup?.layouts?.[getLayoutKey()]?.maxWidth || ''} onChange={e => updatePopup(`layouts.${getLayoutKey()}.maxWidth`, e.target.value)} placeholder="90vw" style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Block list */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Blocks ({getBlocks().length})</div>
                {getBlocks().map((block, idx) => {
                  const bt = BLOCK_TYPES.find(b => b.type === block.type);
                  const Icon = bt?.icon || IoApps;
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div key={block.id}>
                      <div onClick={() => setSelectedBlockId(isSelected ? null : block.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#a78bfa' : '#e5e7eb'}`, background: isSelected ? '#ede9fe' : '#f8fafc', marginBottom: '4px', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Icon size={14} color={bt?.color || '#64748b'} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>{block.type.replace(/_/g, ' ')}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: '#9ca3af', padding: '2px 4px', fontSize: '12px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === getBlocks().length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px', fontSize: '12px', opacity: idx === getBlocks().length - 1 ? 0.3 : 1 }}>↓</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', fontSize: '12px' }}>×</button>
                        </div>
                      </div>
                      {isSelected && selectedBlock && <BlockEditor block={selectedBlock} onChange={updateBlock} onClose={() => setSelectedBlockId(null)} />}
                    </div>
                  );
                })}
              </div>

              {/* Add block */}
              {addingBlockType ? (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    Choose Block Type <button onClick={() => setAddingBlockType(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {BLOCK_TYPES.map(bt => {
                      const Icon = bt.icon;
                      return (
                        <button key={bt.type} onClick={() => addBlock(bt.type)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 10px', border: `1.5px solid ${bt.color}22`, background: bt.color + '11', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: bt.color, transition: 'all 0.15s' }}>
                          <Icon size={14} />{bt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingBlockType(true)} style={{ width: '100%', padding: '10px', border: '2px dashed #c7d2fe', borderRadius: '9px', background: '#f5f3ff', color: '#6366f1', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <IoAdd size={16} /> Add Block
                </button>
              )}
            </>}

            {/* ── DESIGN TAB ── */}
            {activeTab === 'design' && <>
              <PanelField label="Background Type">
                <Sel path="design.backgroundType" options={[{ value: 'color', label: 'Solid Color' }, { value: 'gradient', label: 'Gradient' }, { value: 'image', label: 'Image URL' }]} />
              </PanelField>
              {editingPopup.design?.backgroundType === 'color' && <PanelField label="Background Color"><ColorInp path="design.backgroundColor" label="Background" /></PanelField>}
              {editingPopup.design?.backgroundType === 'gradient' && <PanelField label="Gradient CSS"><Inp path="design.backgroundGradient" placeholder="linear-gradient(135deg, #667eea, #764ba2)" /></PanelField>}
              {editingPopup.design?.backgroundType === 'image' && <PanelField label="Image URL"><Inp path="design.backgroundImage" placeholder="https://..." /></PanelField>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <PanelField label="Border Radius"><Inp path="design.borderRadius" placeholder="16px" /></PanelField>
                <PanelField label="Border"><Inp path="design.border" placeholder="none" /></PanelField>
              </div>
              <PanelField label="Box Shadow"><Inp path="design.boxShadow" placeholder="0 25px 60px rgba(0,0,0,0.35)" /></PanelField>
              <PanelField label="Padding"><Inp path="design.padding" placeholder="40px 36px" /></PanelField>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Overlay</div>
              <Chk path="design.overlayEnabled" label="Show Overlay" />
              {editingPopup.design?.overlayEnabled && <>
                <PanelField label="Overlay Color"><ColorInp path="design.overlayColor" label="Overlay" /></PanelField>
                <PanelField label="Opacity (0–1)"><input type="range" min="0" max="1" step="0.05" value={editingPopup.design?.overlayOpacity ?? 0.55} onChange={e => updatePopup('design.overlayOpacity', Number(e.target.value))} style={{ width: '100%' }} /><span style={{ fontSize: '12px', color: '#64748b' }}>{editingPopup.design?.overlayOpacity ?? 0.55}</span></PanelField>
                <Chk path="design.overlayBlur" label="Blur Background" />
                <Chk path="design.closeOnOverlayClick" label="Close on Overlay Click" />
              </>}

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Close Button</div>
              <Chk path="design.showCloseButton" label="Show Close Button" />
              {editingPopup.design?.showCloseButton && <>
                <PanelField label="Position"><Sel path="design.closeButtonPosition" options={[{ value: 'top_right', label: 'Outside Top Right' }, { value: 'top_left', label: 'Outside Top Left' }, { value: 'inner_top_right', label: 'Inside Top Right' }, { value: 'inner_top_left', label: 'Inside Top Left' }]} /></PanelField>
                <PanelField label="Delay (seconds)"><Inp path="design.closeButtonDelay" type="number" placeholder="0" /></PanelField>
                <PanelField label="Size (px)"><Inp path="design.closeButtonSize" type="number" placeholder="28" /></PanelField>
                <PanelField label="Button Color"><ColorInp path="design.closeButtonColor" label="Close Button" /></PanelField>
              </>}

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '16px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Animation</div>
              <PanelField label="Entry Animation"><Sel path="design.entryAnimation" options={ANIMATIONS.map(a => ({ value: a, label: a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))} /></PanelField>
              <PanelField label="Exit Animation"><Sel path="design.exitAnimation" options={[{ value: 'none', label: 'None' }, ...ANIMATIONS.map(a => ({ value: a, label: a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))]} /></PanelField>
              <PanelField label="Duration (ms)"><Inp path="design.animationDuration" type="number" placeholder="400" /></PanelField>
            </>}

            {/* ── TRIGGER TAB ── */}
            {activeTab === 'trigger' && <>
              <PanelField label="Trigger Type">
                <Sel path="trigger.type" options={[
                  { value: 'immediate', label: 'Immediate (On Page Load)' },
                  { value: 'delay', label: 'Time Delay' },
                  { value: 'scroll_percent', label: 'Scroll Percentage' },
                  { value: 'exit_intent', label: 'Exit Intent' },
                  { value: 'click_element', label: 'Click Element' },
                  { value: 'inactivity', label: 'User Inactivity' },
                ]} />
              </PanelField>
              {editingPopup.trigger?.type === 'delay' && <PanelField label="Delay (seconds)"><Inp path="trigger.delay" type="number" placeholder="3" /></PanelField>}
              {editingPopup.trigger?.type === 'scroll_percent' && <PanelField label="Scroll Percent (0–100)">
                <input type="range" min="0" max="100" value={editingPopup.trigger?.scrollPercent ?? 50} onChange={e => updatePopup('trigger.scrollPercent', Number(e.target.value))} style={{ width: '100%' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{editingPopup.trigger?.scrollPercent ?? 50}%</span>
              </PanelField>}
              {editingPopup.trigger?.type === 'click_element' && <PanelField label="CSS Selector"><Inp path="trigger.clickSelector" placeholder=".open-popup-btn, #hero-cta" /></PanelField>}
              {editingPopup.trigger?.type === 'inactivity' && <PanelField label="Inactivity Seconds"><Inp path="trigger.inactivitySeconds" type="number" placeholder="30" /></PanelField>}
              {editingPopup.trigger?.type === 'exit_intent' && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#92400e' }}>
                  Triggers when the user's cursor moves toward closing the browser tab (desktop only). Works alongside other triggers.
                </div>
              )}
            </>}

            {/* ── DISPLAY TAB ── */}
            {activeTab === 'display' && <>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Platform</div>
              <Chk path="display.showOnWeb" label="Show on Web App" />
              <Chk path="display.showOnApp" label="Show on Mobile App" />

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Device Target</div>
              <PanelField label="Devices">
                <Sel path="display.deviceTarget" options={[
                  { value: 'all', label: 'All Devices' },
                  { value: 'desktop_only', label: 'Desktop Only' },
                  { value: 'tablet_only', label: 'Tablet Only' },
                  { value: 'mobile_only', label: 'Mobile Only' },
                  { value: 'desktop_and_tablet', label: 'Desktop + Tablet' },
                  { value: 'mobile_and_tablet', label: 'Mobile + Tablet' },
                ]} />
              </PanelField>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Page Target</div>
              <PanelField label="Show On">
                <Sel path="display.pageTarget" options={[
                  { value: 'all_pages', label: 'All Pages' },
                  { value: 'homepage', label: 'Homepage Only' },
                  { value: 'shop', label: 'Shop / Category Pages' },
                  { value: 'product', label: 'Product Pages' },
                  { value: 'cart', label: 'Cart Page' },
                  { value: 'checkout', label: 'Checkout Page' },
                  { value: 'account', label: 'Account Pages' },
                  { value: 'custom_pages', label: 'Custom URL Paths' },
                ]} />
              </PanelField>
              {editingPopup.display?.pageTarget === 'custom_pages' && <PanelField label="URL Paths (one per line)">
                <textarea value={(editingPopup.display?.pagePaths || []).join('\n')} onChange={e => updatePopup('display.pagePaths', e.target.value.split('\n').filter(Boolean))} rows={4} placeholder="/sale&#10;/new-arrivals&#10;/products/featured" style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </PanelField>}
              <PanelField label="Excluded Paths (one per line)">
                <textarea value={(editingPopup.display?.excludedPaths || []).join('\n')} onChange={e => updatePopup('display.excludedPaths', e.target.value.split('\n').filter(Boolean))} rows={3} placeholder="/checkout&#10;/account/orders" style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </PanelField>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Frequency</div>
              <PanelField label="Show Frequency">
                <Sel path="display.frequency" options={[
                  { value: 'always', label: 'Always (every visit)' },
                  { value: 'once_per_session', label: 'Once per Session' },
                  { value: 'once_per_day', label: 'Once per Day' },
                  { value: 'once_per_week', label: 'Once per Week' },
                  { value: 'once_per_month', label: 'Once per Month' },
                  { value: 'once_ever', label: 'Once Ever' },
                ]} />
              </PanelField>
              <PanelField label="Max Impressions (0 = unlimited)"><Inp path="display.maxImpressions" type="number" placeholder="0" /></PanelField>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Schedule</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <PanelField label="Start Date"><Inp path="display.startDate" type="datetime-local" /></PanelField>
                <PanelField label="End Date"><Inp path="display.endDate" type="datetime-local" /></PanelField>
              </div>
              <PanelField label="Priority (higher = shows first)"><Inp path="priority" type="number" placeholder="0" /></PanelField>
            </>}

            {/* ── CONDITIONS TAB ── */}
            {activeTab === 'conditions' && <>
              <PanelField label="Login Status">
                <Sel path="conditions.loggedIn" options={[{ value: 'any', label: 'Any Visitor' }, { value: 'logged_in', label: 'Logged In Only' }, { value: 'logged_out', label: 'Logged Out Only' }]} />
              </PanelField>
              <PanelField label="Visitor Type">
                <Sel path="conditions.visitorType" options={[{ value: 'any', label: 'Any' }, { value: 'new', label: 'New Visitors' }, { value: 'returning', label: 'Returning Visitors' }]} />
              </PanelField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <PanelField label="Cart Min Value (R)"><Inp path="conditions.cartMinValue" type="number" placeholder="0" /></PanelField>
                <PanelField label="Cart Max Value (R)"><Inp path="conditions.cartMaxValue" type="number" placeholder="" /></PanelField>
              </div>
              <PanelField label="URL Contains (one per line)">
                <textarea value={(editingPopup.conditions?.urlContains || []).join('\n')} onChange={e => updatePopup('conditions.urlContains', e.target.value.split('\n').filter(Boolean))} rows={3} placeholder="sale&#10;clearance" style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </PanelField>
              <PanelField label="URL Does NOT Contain (one per line)">
                <textarea value={(editingPopup.conditions?.urlNotContains || []).join('\n')} onChange={e => updatePopup('conditions.urlNotContains', e.target.value.split('\n').filter(Boolean))} rows={3} placeholder="thank-you&#10;confirmation" style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              </PanelField>
              <PanelField label="Referrer Contains"><Inp path="conditions.referrerContains" placeholder="google.com, facebook.com" /></PanelField>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Cookie Condition</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <PanelField label="Cookie Name"><Inp path="conditions.cookieName" placeholder="utm_source" /></PanelField>
                <PanelField label="Cookie Value"><Inp path="conditions.cookieValue" placeholder="google" /></PanelField>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '14px 0 10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>Conversion Goal</div>
              <PanelField label="Goal Type">
                <Sel path="goal.type" options={[
                  { value: 'none', label: 'No Goal Tracking' },
                  { value: 'button_click', label: 'Button Click' },
                  { value: 'form_submit', label: 'Form Submit' },
                  { value: 'coupon_copy', label: 'Coupon Copy' },
                  { value: 'url_visit', label: 'URL Visit' },
                ]} />
              </PanelField>
              {editingPopup.goal?.type !== 'none' && <>
                <PanelField label="Success Message"><Inp path="goal.successMessage" placeholder="Thank you!" /></PanelField>
                <Chk path="goal.closeAfterGoal" label="Close popup after goal achieved" />
                <PanelField label="Redirect After Goal (optional)"><Inp path="goal.redirectAfterGoal" placeholder="https://..." /></PanelField>
              </>}
            </>}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Impressions', value: editingPopup.analytics?.impressions || 0, color: '#6366f1', icon: IoEye },
                  { label: 'Clicks', value: editingPopup.analytics?.clicks || 0, color: '#10b981', icon: IoLink },
                  { label: 'Conversions', value: editingPopup.analytics?.conversions || 0, color: '#f59e0b', icon: IoCheckmarkCircle },
                  { label: 'Dismissals', value: editingPopup.analytics?.dismissals || 0, color: '#ef4444', icon: IoClose },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} style={{ background: stat.color + '11', border: `1.5px solid ${stat.color}33`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                      <Icon size={20} color={stat.color} style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color }}>{stat.value.toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
              {editingPopup.analytics?.impressions > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>Conversion Rates</div>
                  {[
                    { label: 'Click-through Rate', val: editingPopup.analytics.impressions > 0 ? ((editingPopup.analytics.clicks / editingPopup.analytics.impressions) * 100).toFixed(1) : 0, color: '#10b981' },
                    { label: 'Conversion Rate', val: editingPopup.analytics.impressions > 0 ? ((editingPopup.analytics.conversions / editingPopup.analytics.impressions) * 100).toFixed(1) : 0, color: '#f59e0b' },
                    { label: 'Dismissal Rate', val: editingPopup.analytics.impressions > 0 ? ((editingPopup.analytics.dismissals / editingPopup.analytics.impressions) * 100).toFixed(1) : 0, color: '#ef4444' },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{r.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: r.color }}>{r.val}%</span>
                      </div>
                      <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${Math.min(r.val, 100)}%`, background: r.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '16px', padding: '12px', background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
                <strong>Created:</strong> {editingPopup.createdAt ? new Date(editingPopup.createdAt).toLocaleDateString() : 'N/A'}<br />
                <strong>Last Modified:</strong> {editingPopup.updatedAt ? new Date(editingPopup.updatedAt).toLocaleString() : 'N/A'}<br />
                {editingPopup.createdBy && <><strong>Created by:</strong> {editingPopup.createdBy.firstName} {editingPopup.createdBy.lastName}</>}
              </div>
            </>}

          </div>
        </>}
      </div>

      {/* ── NEW POPUP MODAL ─────────────────────────────────── */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Create New Popup</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Give your popup a name to get started.</p>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Popup Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Summer Sale Popup, Newsletter Signup..." autoFocus style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowNewModal(false); setNewName(''); }} style={{ padding: '9px 20px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Cancel</button>
              <button onClick={handleCreate} disabled={createMutation.isLoading} style={{ padding: '9px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', opacity: createMutation.isLoading ? 0.7 : 1 }}>
                {createMutation.isLoading ? 'Creating...' : 'Create Popup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
