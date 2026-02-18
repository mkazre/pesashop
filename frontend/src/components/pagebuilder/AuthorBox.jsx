import React from 'react';

export const AuthorBox = ({
  name = 'John Doe',
  bio = 'A passionate writer and developer.',
  avatar = 'https://placehold.co/80x80/e2e8f0/64748b?text=JD',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', gap: '16px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', ...style }}>
    {avatar && <img src={avatar} alt={name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
    <div>
      <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>{name}</h4>
      <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{bio}</p>
    </div>
  </div>
);

AuthorBox.craft = { displayName: 'Author Box' };
