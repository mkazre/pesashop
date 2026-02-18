import React from 'react';
import { useDynamicProps } from './useDynamicProps';

export const LinkWrapper = (rawProps) => {
  const { url = '#', target = '_self', display = 'block', children, className = '', style = {} } = useDynamicProps(rawProps);
  return (
    <a href={url} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className} style={{ display, textDecoration: 'none', color: 'inherit', ...style }}>
      {children}
    </a>
  );
};

LinkWrapper.craft = { displayName: 'Link Wrapper' };
