import React from 'react';
import { useDynamicProps } from './useDynamicProps';

export const IconBox = (rawProps) => {
  const { icon = '⭐', title = 'Feature Title', description = 'Feature description goes here.', iconSize = '48px', iconColor = '#3b82f6', layout = 'top', className = '', style = {} } = useDynamicProps(rawProps);
  const isLeft = layout === 'left';
  return (
    <div className={className} style={{ display: 'flex', flexDirection: isLeft ? 'row' : 'column', alignItems: isLeft ? 'flex-start' : 'center', gap: '12px', textAlign: isLeft ? 'left' : 'center', ...style }}>
      <span style={{ fontSize: iconSize, color: iconColor, lineHeight: 1 }}>{icon}</span>
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{description}</p>
      </div>
    </div>
  );
};

IconBox.craft = { displayName: 'Icon Box' };
