import React, { useState } from 'react';

export const Modal = ({
  triggerText = 'Open Modal',
  title = 'Modal Title',
  content = 'Modal content goes here.',
  triggerStyle = 'button',
  overlayColor = 'rgba(0,0,0,0.5)',
  maxWidth = '500px',
  className = '',
  style = {},
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={className} style={style}>
      {triggerStyle === 'button' ? (
        <button onClick={() => setOpen(true)} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
          {triggerText}
        </button>
      ) : (
        <span onClick={() => setOpen(true)} style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>{triggerText}</span>
      )}
      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: overlayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setOpen(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', maxWidth, width: '90%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
            </div>
            <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6 }}>{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

Modal.craft = { displayName: 'Modal' };
