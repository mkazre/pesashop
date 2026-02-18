import React, { useState } from 'react';

export const Accordion = ({ items = [], className = '', style = {} }) => {
  const [openIndex, setOpenIndex] = useState(-1);
  return (
    <div className={className} style={style}>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px', fontWeight: 500, textAlign: 'left' }}>
            {item.title || `Item ${i + 1}`}
            <span style={{ transform: openIndex === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {openIndex === i && (
            <div style={{ padding: '0 16px 14px', fontSize: '14px', color: '#4b5563', lineHeight: 1.6 }}>
              {item.content || 'Accordion content'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

Accordion.craft = { displayName: 'Accordion' };
