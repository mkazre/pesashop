import React, { useState, useEffect } from 'react';

const ALERT_STYLES = {
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: 'ℹ' },
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '✓' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '✕' },
};

export const AlertBox = ({
  type = 'info', title = 'Alert Title', message = 'Alert message',
  className = '', style = {},
  backgroundColor = null, borderColor = null, textColor = null,
  iconSize = 20, titleFontSize = 16, messageFontSize = 14,
  showCloseButton = false, autoClose = false, autoCloseDelay = 5000,
}) => {
  const [visible, setVisible] = useState(true);
  const preset = ALERT_STYLES[type] || ALERT_STYLES.info;

  useEffect(() => {
    if (autoClose && visible) {
      const t = setTimeout(() => setVisible(false), autoCloseDelay);
      return () => clearTimeout(t);
    }
  }, [autoClose, autoCloseDelay, visible]);

  if (!visible) return null;

  return (
    <div className={className} style={{ padding: '14px 18px', borderRadius: '8px', borderLeft: `4px solid ${borderColor || preset.border}`, backgroundColor: backgroundColor || preset.bg, color: textColor || preset.text, display: 'flex', alignItems: 'flex-start', gap: '12px', ...style }}>
      <span style={{ fontSize: iconSize, lineHeight: 1, flexShrink: 0 }}>{preset.icon}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, fontSize: titleFontSize, marginBottom: '4px' }}>{title}</div>}
        <div style={{ fontSize: messageFontSize, lineHeight: 1.5 }}>{message}</div>
      </div>
      {showCloseButton && (
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', opacity: 0.6, flexShrink: 0 }}>&times;</button>
      )}
    </div>
  );
};

AlertBox.craft = { displayName: 'Alert Box' };
