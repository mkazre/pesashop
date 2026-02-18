import React from 'react';

export const CheckoutPage = ({
  showOrderNotes = true,
  showShipping = true,
  buttonText = 'Place Order',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => {
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
    <div className={className} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', ...style }}>
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

CheckoutPage.craft = { displayName: 'Checkout Page' };
