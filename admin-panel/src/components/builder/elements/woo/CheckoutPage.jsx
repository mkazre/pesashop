import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CheckoutPage = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const {
  showOrderNotes = true,
  showShipping = true,
  buttonText = 'Place Order',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
} = resolved;

  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({ selected: node.events.selected, hovered: node.events.hovered }));
  const fields = [
    { label: 'First Name', type: 'text', half: true },
    { label: 'Last Name', type: 'text', half: true },
    { label: 'Email Address', type: 'email', half: false },
    { label: 'Phone', type: 'tel', half: false },
    { label: 'Street Address', type: 'text', half: false },
    { label: 'City', type: 'text', half: true },
    { label: 'Postcode / ZIP', type: 'text', half: true },
  ];
  return (
    <div ref={(ref) => connect(drag(ref))} className={className}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', ...style, outline: selected ? '2px solid #3b82f6' : hovered ? '1px dashed #93c5fd' : 'none', cursor: 'move' }}>
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Billing Details</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {fields.map((f, i) => (
            <div key={i} style={{ width: f.half ? 'calc(50% - 6px)' : '100%' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>{f.label} *</label>
              <input type={f.type} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
          ))}
        </div>
        {showOrderNotes && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#374151' }}>Order Notes</label>
            <textarea rows={3} placeholder="Notes about your order..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }} />
          </div>
        )}
      </div>
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Your Order</h3>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '14px' }}><span>Product</span><span>Subtotal</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}><span>Sample Product × 1</span><span>$29.99</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}><span>Subtotal</span><span>$29.99</span></div>
          {showShipping && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}><span>Shipping</span><span>Free</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, fontSize: '16px' }}><span>Total</span><span>$29.99</span></div>
          <button style={{ width: '100%', padding: '14px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}>{buttonText}</button>
        </div>
      </div>
    </div>
  );
};

export const CheckoutPageSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Button Text</label>
      <input type="text" value={props.buttonText || ''} onChange={(e) => setProp((p) => { p.buttonText = e.target.value; })}
        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }} />
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Button Color</label>
      <input type="color" value={props.buttonColor || '#3b82f6'} onChange={(e) => setProp((p) => { p.buttonColor = e.target.value; })}
        style={{ width: '100%', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '12px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px' }}>
        <input type="checkbox" checked={props.showOrderNotes !== false} onChange={(e) => setProp((p) => { p.showOrderNotes = e.target.checked; })} /> Show Order Notes
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input type="checkbox" checked={props.showShipping !== false} onChange={(e) => setProp((p) => { p.showShipping = e.target.checked; })} /> Show Shipping
      </label>
    </div>
  );
};

CheckoutPage.craft = {
  displayName: 'Checkout Page',
  props: { showOrderNotes: true, showShipping: true, buttonText: 'Place Order', buttonColor: '#3b82f6', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
  related: { settings: CheckoutPageSettings },
};
