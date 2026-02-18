import React from 'react';

export const ContentTimeline = ({
  items = [
    { title: 'Step 1', content: 'First step description', date: '2024', color: '#3b82f6' },
    { title: 'Step 2', content: 'Second step description', date: '2024', color: '#8b5cf6' },
    { title: 'Step 3', content: 'Third step description', date: '2024', color: '#ec4899' },
  ],
  lineColor = '#e5e7eb',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ position: 'relative', paddingLeft: '32px', ...style }}>
    <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', backgroundColor: lineColor }} />
    {items.map((item, i) => (
      <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ position: 'absolute', left: '-32px', top: '4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: item.color || '#3b82f6', border: '3px solid #fff', boxShadow: '0 0 0 2px ' + (item.color || '#3b82f6') }} />
        {item.date && <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>{item.date}</div>}
        <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>{item.title}</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{item.content}</p>
      </div>
    ))}
  </div>
);

ContentTimeline.craft = { displayName: 'Content Timeline' };
