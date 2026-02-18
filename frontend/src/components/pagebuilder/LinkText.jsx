import React from 'react';
import { useDynamicProps } from './useDynamicProps';

export const LinkText = (rawProps) => {
  const { text = 'Link Text', url = '#', target = '_self', color = '#3b82f6', hoverColor = '#2563eb', className = '', style = {} } = useDynamicProps(rawProps);
  return (
    <a href={url} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className} style={{ color, textDecoration: 'underline', ...style }}>
      {text}
    </a>
  );
};

LinkText.craft = { displayName: 'Link Text' };
