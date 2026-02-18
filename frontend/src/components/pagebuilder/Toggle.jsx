import React, { useState } from 'react';

export const Toggle = ({
  title = 'Toggle Title',
  content = 'Toggle content goes here.',
  icon = '▸',
  className = '',
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={className} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', ...style }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: 'none', background: '#f9fafb', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left' }}>
        <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>{icon}</span>
        {title}
      </button>
      {open && <div style={{ padding: '12px 16px', fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>{content}</div>}
    </div>
  );
};

Toggle.craft = { displayName: 'Toggle' };
