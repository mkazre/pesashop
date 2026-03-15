import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const MyAccount = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  tabs = ['Dashboard', 'Orders', 'Downloads', 'Addresses', 'Account Details', 'Logout'],
  userName = 'John Doe',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
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
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
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

export const MyAccountSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>User Name</label>
      <input type="text" value={props.userName || ''} onChange={(e) => setProp((p) => { p.userName = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
    </div>
  );
};

MyAccount.craft = {
  displayName: 'My Account',
  props: { tabs: ['Dashboard', 'Orders', 'Downloads', 'Addresses', 'Account Details', 'Logout'], userName: 'John Doe', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: MyAccountSettings },
};
