import React from 'react';

export const ListItem = ({
  items = ['List item one', 'List item two', 'List item three'],
  listType = 'ul',
  icon = '',
  iconColor = '#3b82f6',
  gap = '8px',
  className = '',
  style = {},
}) => {
  const Tag = listType === 'ol' ? 'ol' : 'ul';
  return (
    <Tag className={className} style={{ listStyle: icon ? 'none' : undefined, paddingLeft: icon ? '0' : undefined, display: 'flex', flexDirection: 'column', gap, ...style }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span style={{ color: iconColor, flexShrink: 0 }}>{icon}</span>}
          {item}
        </li>
      ))}
    </Tag>
  );
};

ListItem.craft = { displayName: 'List Item' };
