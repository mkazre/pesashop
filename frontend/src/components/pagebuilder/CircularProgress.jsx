import React from 'react';

export const CircularProgress = ({
  value = 75,
  max = 100,
  size = 120,
  strokeWidth = 8,
  trackColor = '#e5e7eb',
  barColor = '#3b82f6',
  showValue = true,
  label = '',
  className = '',
  style = {},
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px', ...style }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={barColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      {showValue && (
        <div style={{ position: 'relative', marginTop: -size / 2 - 10, fontSize: '20px', fontWeight: 700, color: barColor }}>
          {Math.round(pct)}%
        </div>
      )}
      {label && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: showValue ? size / 2 - 14 : 0 }}>{label}</div>}
    </div>
  );
};

CircularProgress.craft = { displayName: 'Circular Progress' };
