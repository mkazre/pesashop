import React from 'react';

export const HeaderRow = ({
  children,
  layout = 'space-between',
  backgroundColor = 'transparent',
  padding = '8px 0',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: layout, backgroundColor, padding, gap: '16px', ...style }}>
    {children}
  </div>
);

HeaderRow.craft = { displayName: 'Header Row' };
