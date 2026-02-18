import React, { useState } from 'react';

export const Tabs = ({
  tabs = [
    { label: 'Tab 1', content: 'Content for tab 1' },
    { label: 'Tab 2', content: 'Content for tab 2' },
    { label: 'Tab 3', content: 'Content for tab 3' },
  ],
  activeColor = '#3b82f6',
  inactiveColor = '#6b7280',
  tabStyle = 'underline',
  className = '',
  style = {},
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', borderBottom: tabStyle === 'underline' ? '2px solid #e5e7eb' : 'none', gap: tabStyle === 'pills' ? '8px' : '0' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === i ? 600 : 400,
            borderBottom: tabStyle === 'underline' ? (activeTab === i ? `2px solid ${activeColor}` : '2px solid transparent') : 'none',
            background: tabStyle === 'pills' ? (activeTab === i ? activeColor : '#f3f4f6') : 'transparent',
            color: tabStyle === 'pills' ? (activeTab === i ? '#fff' : inactiveColor) : (activeTab === i ? activeColor : inactiveColor),
            borderRadius: tabStyle === 'pills' ? '6px' : '0',
            marginBottom: tabStyle === 'underline' ? '-2px' : '0',
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: '16px 0' }}>
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

Tabs.craft = { displayName: 'Tabs' };
