import React, { useState } from 'react';

export const OffCanvas = ({
  triggerText = 'Open Panel',
  title = 'Panel Title',
  content = 'Panel content goes here.',
  position = 'right',
  width = '320px',
  overlayColor = 'rgba(0,0,0,0.5)',
  backgroundColor = '#ffffff',
  className = '',
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const posStyle = position === 'left'
    ? { left: 0, transform: open ? 'translateX(0)' : 'translateX(-100%)' }
    : { right: 0, transform: open ? 'translateX(0)' : 'translateX(100%)' };

  return (
    <div className={className} style={style}>
      <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
        {triggerText}
      </button>
      {open && <div style={{ position: 'fixed', inset: 0, backgroundColor: overlayColor, zIndex: 9998 }} onClick={() => setOpen(false)} />}
      <div style={{ position: 'fixed', top: 0, bottom: 0, width, backgroundColor, zIndex: 9999, transition: 'transform 0.3s ease', boxShadow: open ? '-4px 0 20px rgba(0,0,0,0.1)' : 'none', ...posStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
        </div>
        <div style={{ padding: '20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>{content}</div>
      </div>
    </div>
  );
};

OffCanvas.craft = { displayName: 'Off Canvas' };
