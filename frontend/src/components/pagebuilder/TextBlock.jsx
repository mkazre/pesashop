import React from 'react';

export const TextBlock = ({
  content = '<p>This is a text block.</p>',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', ...style }} dangerouslySetInnerHTML={{ __html: content }} />
);

TextBlock.craft = { displayName: 'Text Block' };
