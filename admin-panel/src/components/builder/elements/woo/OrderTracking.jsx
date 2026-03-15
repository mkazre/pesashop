import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const OrderTracking = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  title = 'Track Your Order',
  description = 'Enter your order ID and billing email to track your order status.',
  buttonText = 'Track Order',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ maxWidth: '500px', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '12px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.5 }}>{description}</p>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Order ID</label>
        <input type="text" placeholder="Found in your order confirmation email" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Billing Email</label>
        <input type="email" placeholder="Email you used during checkout" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
      </div>
      <button style={{ width: '100%', padding: '12px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{buttonText}</button>
    </div>
  );
};

export const OrderTrackingSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      {[{ key: 'title', label: 'Title' }, { key: 'buttonText', label: 'Button Text' }].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>{label}</label>
          <input type="text" value={props[key] || ''} onChange={(e) => setProp((p) => { p[key] = e.target.value; })}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
        </div>
      ))}
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Button Color</label>
      <input type="color" value={props.buttonColor || '#3b82f6'} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
    </div>
  );
};

OrderTracking.craft = {
  displayName: 'Order Tracking',
  props: { title: 'Track Your Order', description: 'Enter your order ID and billing email to track your order status.', buttonText: 'Track Order', buttonColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: OrderTrackingSettings },
};
