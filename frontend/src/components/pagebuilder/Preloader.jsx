import React from 'react';

export const Preloader = ({
  type = 'spinner',
  color = '#3b82f6',
  size = '40px',
  className = '',
  style = {},
}) => {
  const spinnerStyle = {
    width: size, height: size, border: `3px solid #e5e7eb`,
    borderTopColor: color, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', ...style }}>
      <div style={spinnerStyle} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

Preloader.craft = { displayName: 'Preloader' };
