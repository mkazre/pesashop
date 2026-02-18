import React from 'react';
import { useDynamicProps } from './useDynamicProps';

export const LinkButton = (rawProps) => {
  const { text = 'Click Here', url = '#', target = '_self', variant = 'primary', size = 'md', className = '', style = {} } = useDynamicProps(rawProps);
  const sizeStyles = { sm: { padding: '6px 12px', fontSize: '13px' }, md: { padding: '10px 20px', fontSize: '14px' }, lg: { padding: '14px 28px', fontSize: '16px' } };
  const variantStyles = {
    primary: { backgroundColor: '#3b82f6', color: '#fff', border: 'none' },
    secondary: { backgroundColor: '#6b7280', color: '#fff', border: 'none' },
    outline: { backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6' },
  };
  return (
    <a href={url} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className} style={{ display: 'inline-block', borderRadius: '6px', textDecoration: 'none', cursor: 'pointer', ...sizeStyles[size], ...variantStyles[variant], ...style }}>
      {text}
    </a>
  );
};

LinkButton.craft = { displayName: 'Link Button' };
