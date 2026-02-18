import React, { useState } from 'react';

export const ToggleSwitch = ({
  label = 'Toggle',
  defaultChecked = false,
  activeColor = '#3b82f6',
  inactiveColor = '#d1d5db',
  size = 'md',
  className = '',
  style = {},
}) => {
  const [checked, setChecked] = useState(defaultChecked);
  const sizes = { sm: { w: 36, h: 20, dot: 16 }, md: { w: 44, h: 24, dot: 20 }, lg: { w: 52, h: 28, dot: 24 } };
  const s = sizes[size] || sizes.md;

  return (
    <label className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', ...style }}>
      <div onClick={() => setChecked(!checked)} style={{ width: s.w, height: s.h, borderRadius: s.h, backgroundColor: checked ? activeColor : inactiveColor, position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: (s.h - s.dot) / 2, left: checked ? s.w - s.dot - (s.h - s.dot) / 2 : (s.h - s.dot) / 2, width: s.dot, height: s.dot, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      {label && <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>}
    </label>
  );
};

ToggleSwitch.craft = { displayName: 'Toggle Switch' };
