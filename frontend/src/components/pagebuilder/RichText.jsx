import React from 'react';

export const RichText = ({
  content = '<p>Rich text content.</p>',
  className = '',
  style = {},
}) => (
  <div className={className} style={style} dangerouslySetInnerHTML={{ __html: content }} />
);

RichText.craft = { displayName: 'Rich Text' };
