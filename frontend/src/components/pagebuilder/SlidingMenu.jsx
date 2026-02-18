import React, { useState } from 'react';

export const SlidingMenu = ({
  items = [
    { label: 'Home', url: '#', icon: '🏠' },
    { label: 'About', url: '#', icon: '📄' },
    { label: 'Services', url: '#', icon: '⚙️' },
    { label: 'Contact', url: '#', icon: '✉️' },
  ],
  triggerText = '☰ Menu',
  position = 'left',
  width = '280px',
  backgroundColor = '#1f2937',
  textColor = '#f3f4f6',
  accentColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const posStyle = position === 'left'
    ? { left: 0, transform: open ? 'translateX(0)' : 'translateX(-100%)' }
    : { right: 0, transform: open ? 'translateX(0)' : 'translateX(100%)' };

  return (
    <div className={className} style={style}>
      <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit', padding: '8px' }}>
        {triggerText}
      </button>
      {open && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }} onClick={() => setOpen(false)} />}
      <div style={{ position: 'fixed', top: 0, bottom: 0, width, backgroundColor, zIndex: 9999, transition: 'transform 0.3s ease', ...posStyle }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: textColor, fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>
        <nav>
          {items.map((item, i) => (
            <a key={i} href={item.url || '#'} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', color: textColor, textDecoration: 'none', fontSize: '15px', transition: 'background 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = accentColor + '20'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

SlidingMenu.craft = { displayName: 'Sliding Menu' };
