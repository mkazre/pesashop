import toast from 'react-hot-toast';

// Inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('toast-spin-kf')) {
  const style = document.createElement('style');
  style.id = 'toast-spin-kf';
  style.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

const ICONS = {
  success: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#22c55e"/>
      <path d="M6.5 11.5L9.5 14.5L15.5 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#ef4444"/>
      <path d="M11 7V12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="11" cy="15" r="1" fill="#fff"/>
    </svg>
  ),
  warning: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#f59e0b"/>
      <path d="M11 7V12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="11" cy="15" r="1" fill="#fff"/>
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#6366f1"/>
      <circle cx="11" cy="7.5" r="1" fill="#fff"/>
      <path d="M11 10V15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

const STYLES = {
  success: { bg: '#f0fdf4', border: '#bbf7d0' },
  error:   { bg: '#fef2f2', border: '#fecaca' },
  warning: { bg: '#fffbeb', border: '#fde68a' },
  info:    { bg: '#eef2ff', border: '#c7d2fe' },
};

function renderToast(message, type, opts = {}) {
  const style = STYLES[type] || STYLES.info;
  const icon = ICONS[type] || ICONS.info;

  // Support string or { title, description } format
  let title, description;
  if (typeof message === 'object' && message !== null && message.title) {
    title = message.title;
    description = message.description || '';
  } else {
    title = String(message);
    description = '';
  }

  return toast.custom(
    (t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: '12px',
          padding: '12px 16px',
          minWidth: 0,
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateX(0)' : 'translateX(50px)',
          transition: 'all 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937', lineHeight: '1.3' }}>{title}</div>
          {description && (
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', lineHeight: '1.3' }}>{description}</div>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            fontSize: '18px',
            padding: '0 0 0 4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    ),
    { duration: opts.duration || 4000, ...opts }
  );
}

const customToast = (message) => renderToast(message, 'info');
customToast.success = (message, opts) => renderToast(message, 'success', opts);
customToast.error = (message, opts) => renderToast(message, 'error', opts);
customToast.warning = (message, opts) => renderToast(message, 'warning', opts);
customToast.info = (message, opts) => renderToast(message, 'info', opts);
customToast.loading = (message, opts) => {
  const title = typeof message === 'object' ? message.title || message : String(message);
  return toast.custom(
    (t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          minWidth: 0,
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateX(0)' : 'translateX(50px)',
          transition: 'all 0.3s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="11" cy="11" r="9" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="40 20" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937', lineHeight: '1.3' }}>{title}</div>
        </div>
      </div>
    ),
    { duration: opts?.duration || Infinity, ...opts }
  );
};
customToast.dismiss = toast.dismiss;
customToast.promise = (promise, msgs, opts) => {
  const id = customToast.loading(msgs.loading || 'Loading...');
  return promise
    .then((result) => {
      toast.dismiss(id);
      customToast.success(msgs.success || 'Done!');
      return result;
    })
    .catch((err) => {
      toast.dismiss(id);
      customToast.error(msgs.error || err?.message || 'Something went wrong');
      throw err;
    });
};
customToast.custom = toast.custom;
customToast.remove = toast.remove;

export default customToast;
