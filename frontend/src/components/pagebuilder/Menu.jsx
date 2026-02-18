import React from 'react';

export const Menu = ({
  items = [
    { label: 'Home', url: '#' },
    { label: 'About', url: '#' },
    { label: 'Services', url: '#' },
    { label: 'Contact', url: '#' },
  ],
  layout = 'horizontal',
  fontSize = '14px',
  color = '#374151',
  activeColor = '#3b82f6',
  gap = '24px',
  className = '',
  style = {},
}) => (
  <nav className={className} style={style}>
    <ul style={{ display: 'flex', flexDirection: layout === 'vertical' ? 'column' : 'row', gap, listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={i}>
          <a href={item.url || '#'} style={{ color, fontSize, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.target.style.color = activeColor; }}
            onMouseLeave={(e) => { e.target.style.color = color; }}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

Menu.craft = { displayName: 'Menu' };
