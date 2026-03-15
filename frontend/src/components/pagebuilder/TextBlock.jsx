import React from 'react';

export const TextBlock = ({
  content = '<p>This is a text block.</p>',
  className = '',
  style = {},
}) => {
  const merged = { wordWrap: 'break-word', overflowWrap: 'break-word', ...style };
  if (merged.WebkitLineClamp && merged.display !== '-webkit-box') merged.display = '-webkit-box';
  return <div className={className} style={merged} dangerouslySetInnerHTML={{ __html: content }} />;
};

TextBlock.craft = { displayName: 'Text Block' };
