import React from 'react';

export const TestElement = ({ content = 'Test Element', className = '', style = {} }) => (
  <div className={className} style={{ padding: '16px', border: '2px dashed #d1d5db', borderRadius: '8px', color: '#6b7280', ...style }}>
    {content}
  </div>
);

TestElement.craft = { displayName: 'Test Element' };
