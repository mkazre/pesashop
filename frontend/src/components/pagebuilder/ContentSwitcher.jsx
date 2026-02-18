import React, { useState } from 'react';

export const ContentSwitcher = ({
  label1 = 'Monthly',
  label2 = 'Yearly',
  content1 = 'Monthly content goes here.',
  content2 = 'Yearly content goes here.',
  activeColor = '#3b82f6',
  inactiveColor = '#e5e7eb',
  className = '',
  style = {},
}) => {
  const [active, setActive] = useState(0);
  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0', marginBottom: '20px' }}>
        <button onClick={() => setActive(0)} style={{ padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, borderRadius: '8px 0 0 8px', backgroundColor: active === 0 ? activeColor : inactiveColor, color: active === 0 ? '#fff' : '#6b7280' }}>{label1}</button>
        <button onClick={() => setActive(1)} style={{ padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, borderRadius: '0 8px 8px 0', backgroundColor: active === 1 ? activeColor : inactiveColor, color: active === 1 ? '#fff' : '#6b7280' }}>{label2}</button>
      </div>
      <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
        {active === 0 ? content1 : content2}
      </div>
    </div>
  );
};

ContentSwitcher.craft = { displayName: 'Content Switcher' };
