import React from 'react';

export const LoginForm = ({
  title = 'Sign In',
  showRemember = true,
  showForgot = true,
  buttonText = 'Sign In',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ maxWidth: '400px', padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', ...style }}>
    {title && <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 600, textAlign: 'center' }}>{title}</h3>}
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Email</label>
        <input type="email" placeholder="you@example.com" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Password</label>
        <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
        {showRemember && <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}><input type="checkbox" /> Remember me</label>}
        {showForgot && <a href="#" style={{ color: buttonColor, textDecoration: 'none' }}>Forgot password?</a>}
      </div>
      <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
        {buttonText}
      </button>
    </form>
  </div>
);

LoginForm.craft = { displayName: 'Login Form' };
