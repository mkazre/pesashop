import React, { useState } from 'react';

export const DynamicTabs = ({
  tabs = [
    { label: 'Tab 1', content: 'Dynamic tab content 1' },
    { label: 'Tab 2', content: 'Dynamic tab content 2' },
    { label: 'Tab 3', content: 'Dynamic tab content 3' },
  ],
  activeColor = '#3b82f6',
  inactiveColor = '#6b7280',
  tabStyle = 'underline',
  orientation = 'horizontal',
  className = '',
  style = {},
}) => {
  const [active, setActive] = useState(0);

  return (
    <div className={className} style={{ display: orientation === 'vertical' ? 'flex' : 'block', gap: '16px', ...style }}>
      <div style={{ display: 'flex', flexDirection: orientation === 'vertical' ? 'column' : 'row', borderBottom: orientation === 'horizontal' && tabStyle === 'underline' ? '2px solid #e5e7eb' : 'none', gap: tabStyle === 'pills' ? '8px' : '0' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active === i ? 600 : 400,
            borderBottom: orientation === 'horizontal' && tabStyle === 'underline' ? (active === i ? `2px solid ${activeColor}` : '2px solid transparent') : 'none',
            background: tabStyle === 'pills' ? (active === i ? activeColor : '#f3f4f6') : 'transparent',
            color: tabStyle === 'pills' ? (active === i ? '#fff' : inactiveColor) : (active === i ? activeColor : inactiveColor),
            borderRadius: tabStyle === 'pills' ? '6px' : '0',
            marginBottom: orientation === 'horizontal' && tabStyle === 'underline' ? '-2px' : '0',
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: '16px 0', flex: 1 }}>{tabs[active]?.content}</div>
    </div>
  );
};

DynamicTabs.craft = { displayName: 'Dynamic Tabs' };
