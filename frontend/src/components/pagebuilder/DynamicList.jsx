import React from 'react';

export const DynamicList = ({
  items = [],
  layout = 'vertical',
  gap = '16px',
  showIcon = true,
  showDescription = true,
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', flexDirection: layout === 'horizontal' ? 'row' : 'column', gap, flexWrap: 'wrap', ...style }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
        {showIcon && item.icon && <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>}
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{item.title}</div>
          {showDescription && item.description && <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.description}</div>}
        </div>
      </div>
    ))}
  </div>
);

DynamicList.craft = { displayName: 'Dynamic List' };
