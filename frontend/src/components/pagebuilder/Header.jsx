import React from 'react';

export const Header = ({
  children,
  sticky = false,
  backgroundColor = '#ffffff',
  shadow = true,
  className = '',
  style = {},
}) => (
  <header className={className} style={{
    backgroundColor, boxShadow: shadow ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    ...(sticky ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
    ...style,
  }}>
    {children}
  </header>
);

Header.craft = { displayName: 'Header' };
