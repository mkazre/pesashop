import React, { useState, useEffect } from 'react';

export const TableOfContents = ({
  title = 'Table of Contents',
  headingLevels = 'h2,h3',
  backgroundColor = '#f9fafb',
  borderColor = '#e5e7eb',
  linkColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const selector = headingLevels.split(',').map(h => h.trim()).join(',');
    const elements = document.querySelectorAll(selector);
    const items = Array.from(elements).map((el, i) => {
      if (!el.id) el.id = `toc-heading-${i}`;
      return { id: el.id, text: el.textContent, level: parseInt(el.tagName[1]) };
    });
    setHeadings(items);
  }, [headingLevels]);

  if (!headings.length) return null;

  const minLevel = Math.min(...headings.map(h => h.level));

  return (
    <nav className={className} style={{ padding: '20px', backgroundColor, border: `1px solid ${borderColor}`, borderRadius: '8px', ...style }}>
      {title && <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>{title}</h4>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {headings.map((h, i) => (
          <li key={i} style={{ paddingLeft: `${(h.level - minLevel) * 16}px` }}>
            <a href={`#${h.id}`} style={{ display: 'block', padding: '4px 0', color: linkColor, textDecoration: 'none', fontSize: '14px', lineHeight: 1.6 }}
              onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

TableOfContents.craft = { displayName: 'Table of Contents' };
