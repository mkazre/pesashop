import React from 'react';

export const PostTerms = ({
  terms = ['Technology', 'Design', 'Development'],
  taxonomy = 'Categories',
  separator = ', ',
  showLabel = true,
  labelColor = '#374151',
  termColor = '#3b82f6',
  fontSize = '14px',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ fontSize, ...style }}>
    {showLabel && <span style={{ color: labelColor, fontWeight: 500 }}>{taxonomy}: </span>}
    {terms.map((term, i) => (
      <span key={i}>
        <a href="#" style={{ color: termColor, textDecoration: 'none' }}>{term}</a>
        {i < terms.length - 1 && separator}
      </span>
    ))}
  </div>
);

PostTerms.craft = { displayName: 'Post Terms' };
