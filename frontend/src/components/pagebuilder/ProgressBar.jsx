import React from 'react';

export const ProgressBar = ({
  label = 'Progress',
  value = 75,
  max = 100,
  showValue = true,
  barColor = '#3b82f6',
  trackColor = '#e5e7eb',
  height = '12px',
  animated = true,
  className = '',
  style = {},
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className} style={style}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
          {label && <span style={{ fontWeight: 500 }}>{label}</span>}
          {showValue && <span style={{ color: '#6b7280' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ width: '100%', backgroundColor: trackColor, borderRadius: '999px', overflow: 'hidden', height }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '999px', transition: animated ? 'width 1s ease' : 'none' }} />
      </div>
    </div>
  );
};

ProgressBar.craft = { displayName: 'Progress Bar' };
