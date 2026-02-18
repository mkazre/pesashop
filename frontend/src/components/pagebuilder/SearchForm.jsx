import React from 'react';

export const SearchForm = ({
  placeholder = 'Search...',
  buttonText = 'Search',
  showButton = true,
  action = '/search',
  className = '',
  style = {},
}) => (
  <form className={className} style={{ display: 'flex', gap: '8px', ...style }} action={action} method="GET">
    <input type="text" name="q" placeholder={placeholder}
      style={{ flex: 1, padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
    {showButton && (
      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
        {buttonText}
      </button>
    )}
  </form>
);

SearchForm.craft = { displayName: 'Search Form' };
