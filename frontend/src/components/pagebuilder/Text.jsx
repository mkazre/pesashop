import React from 'react';
import { useDynamicProps } from './useDynamicProps';

/** View-only Text for page builder */
export const Text = (rawProps) => {
  const { content = 'Text content', className = '', style = {} } = useDynamicProps(rawProps);
  return (
    <p className={`text ${className}`} style={{ overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', ...style }}>
      {content}
    </p>
  );
};

Text.craft = { displayName: 'Text' };
