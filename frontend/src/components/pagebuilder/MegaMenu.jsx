import React, { useState } from 'react';

export const MegaMenu = ({
  items = [
    { label: 'Products', children: [{ label: 'Category 1', url: '#' }, { label: 'Category 2', url: '#' }] },
    { label: 'Services', children: [{ label: 'Service 1', url: '#' }] },
    { label: 'About', url: '#', children: [] },
    { label: 'Contact', url: '#', children: [] },
  ],
  backgroundColor = '#ffffff',
  dropdownBg = '#ffffff',
  textColor = '#374151',
  className = '',
  style = {},
}) => {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <nav className={className} style={{ backgroundColor, padding: '0 16px', ...style }}>
      <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ position: 'relative' }}
            onMouseEnter={() => setOpenIndex(i)} onMouseLeave={() => setOpenIndex(-1)}>
            <a href={item.url || '#'} style={{ display: 'block', padding: '14px 18px', color: textColor, textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>{item.label}</a>
            {item.children?.length > 0 && openIndex === i && (
              <div style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: dropdownBg, border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px', minWidth: '200px', zIndex: 100 }}>
                {item.children.map((child, j) => (
                  <a key={j} href={child.url || '#'} style={{ display: 'block', padding: '8px 12px', color: textColor, textDecoration: 'none', fontSize: '13px', borderRadius: '4px' }}>{child.label}</a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

MegaMenu.craft = { displayName: 'Mega Menu' };
