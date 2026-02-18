import React from 'react';
import { useDynamicProps } from './useDynamicProps';

/** View-only Heading for page builder */
export const Heading = (rawProps) => {
  const { content = 'Heading', level = 2, className = '', style = {} } = useDynamicProps(rawProps);
  const Tag = `h${Math.min(6, Math.max(1, level))}`;
  return (
    <Tag className={`heading ${className}`} style={{ overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', ...style }}>
      {content}
    </Tag>
  );
};

Heading.craft = { displayName: 'Heading' };
