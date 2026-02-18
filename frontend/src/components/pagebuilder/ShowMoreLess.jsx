import React, { useState } from 'react';

export const ShowMoreLess = ({
  content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  collapsedHeight = '80px',
  moreText = 'Show More',
  lessText = 'Show Less',
  buttonColor = '#3b82f6',
  fontSize = '14px',
  textColor = '#374151',
  className = '',
  style = {},
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className} style={style}>
      <div style={{ maxHeight: expanded ? 'none' : collapsedHeight, overflow: 'hidden', fontSize, color: textColor, lineHeight: 1.6, transition: 'max-height 0.3s ease' }}>
        {content}
      </div>
      <button onClick={() => setExpanded(!expanded)}
        style={{ marginTop: '8px', background: 'none', border: 'none', color: buttonColor, cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}>
        {expanded ? lessText : moreText}
      </button>
    </div>
  );
};

ShowMoreLess.craft = { displayName: 'Show More/Less' };
