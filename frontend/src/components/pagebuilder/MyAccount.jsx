import React, { useState } from 'react';

export const MyAccount = ({
  tabs = ['Dashboard', 'Orders', 'Downloads', 'Addresses', 'Account Details', 'Logout'],
  userName = 'John Doe',
  className = '',
  style = {},
}) => {
  const [active, setActive] = useState(0);
  const content = {
    0: `Hello ${userName}! From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.`,
    1: 'No orders have been made yet.',
    2: 'No downloads available yet.',
    3: 'The following addresses will be used on the checkout page by default.',
    4: 'Edit your account details below.',
    5: 'Are you sure you want to log out?',
  };

  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', ...style }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '12px 16px', border: 'none', textAlign: 'left', fontSize: '14px', cursor: 'pointer',
            backgroundColor: active === i ? '#3b82f6' : 'transparent', color: active === i ? '#fff' : '#374151',
            borderRadius: '6px', fontWeight: active === i ? 600 : 400,
          }}>{tab}</button>
        ))}
      </nav>
      <div style={{ padding: '16px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
        {content[active] || ''}
      </div>
    </div>
  );
};

MyAccount.craft = { displayName: 'My Account' };
