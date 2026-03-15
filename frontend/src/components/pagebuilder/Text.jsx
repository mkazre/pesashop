import React from 'react';
import { useDynamicProps } from './useDynamicProps';

/** View-only Text for page builder */
export const Text = (rawProps) => {
  const { content = 'Text content', className = '', style = {} } = useDynamicProps(rawProps);
  const merged = { wordWrap: 'break-word', overflowWrap: 'break-word', ...style };
  if (merged.WebkitLineClamp && merged.display !== '-webkit-box') {
    merged.display = '-webkit-box';
  }
  return (
    <p className={`text ${className}`} style={merged}>
      {content}
    </p>
  );
};

Text.craft = { displayName: 'Text' };
