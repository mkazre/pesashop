import React from 'react';

export const Span = ({ content = 'Span text', className = '', style = {} }) => (
  <span className={className} style={style}>{content}</span>
);

Span.craft = { displayName: 'Span' };
