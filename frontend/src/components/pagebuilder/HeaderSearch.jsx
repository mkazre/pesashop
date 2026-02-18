import React, { useState } from 'react';

export const HeaderSearch = ({
  placeholder = 'Search...',
  iconColor = '#6b7280',
  expandable = true,
  action = '/search',
  className = '',
  style = {},
}) => {
  const [expanded, setExpanded] = useState(!expandable);

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      {!expanded && expandable ? (
        <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: iconColor, padding: '8px' }}>🔍</button>
      ) : (
        <form action={action} method="GET" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="text" name="q" placeholder={placeholder} autoFocus={expandable}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', width: '200px' }} />
          {expandable && (
            <button type="button" onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#9ca3af', padding: '4px' }}>&times;</button>
          )}
        </form>
      )}
    </div>
  );
};

HeaderSearch.craft = { displayName: 'Header Search' };
