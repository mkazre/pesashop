import React from 'react';

export const AdjacentPosts = ({
  prevLabel = '← Previous Post',
  nextLabel = 'Next Post →',
  prevTitle = 'How to Get Started with Web Design',
  nextTitle = 'Advanced CSS Techniques for 2024',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '16px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', ...style }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{prevLabel}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>{prevTitle}</div>
    </div>
    <div style={{ flex: 1, textAlign: 'right' }}>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{nextLabel}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#3b82f6' }}>{nextTitle}</div>
    </div>
  </div>
);

AdjacentPosts.craft = { displayName: 'Adjacent Posts' };
