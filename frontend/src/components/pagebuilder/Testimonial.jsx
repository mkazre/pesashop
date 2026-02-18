import React from 'react';

export const Testimonial = ({
  quote = 'This product changed my life. Highly recommended!',
  author = 'Jane Doe',
  role = 'CEO, Company',
  avatar = 'https://placehold.co/80x80/e2e8f0/64748b?text=JD',
  rating = 5,
  className = '',
  style = {},
}) => (
  <div className={className} style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', ...style }}>
    {avatar && <img src={avatar} alt={author} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />}
    {rating > 0 && <div style={{ marginBottom: '12px', fontSize: '18px', color: '#f59e0b' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>}
    <blockquote style={{ margin: '0 0 16px', fontSize: '16px', fontStyle: 'italic', color: '#374151', lineHeight: 1.6 }}>"{quote}"</blockquote>
    <div style={{ fontWeight: 600, fontSize: '14px' }}>{author}</div>
    {role && <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>{role}</div>}
  </div>
);

Testimonial.craft = { displayName: 'Testimonial' };
