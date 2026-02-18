import React, { useState } from 'react';

export const Tooltip = ({
  triggerText = 'Hover me',
  tooltipText = 'This is a tooltip',
  position = 'top',
  backgroundColor = '#1f2937',
  textColor = '#ffffff',
  fontSize = '13px',
  maxWidth = '200px',
  className = '',
  style = {},
}) => {
  const [show, setShow] = useState(false);
  const posStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  return (
    <span className={className} style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ borderBottom: '1px dashed #9ca3af', cursor: 'help' }}>{triggerText}</span>
      {show && (
        <div style={{ position: 'absolute', ...posStyles[position], backgroundColor, color: textColor, fontSize, padding: '6px 10px', borderRadius: '6px', whiteSpace: 'normal', maxWidth, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, lineHeight: 1.4 }}>
          {tooltipText}
        </div>
      )}
    </span>
  );
};

Tooltip.craft = { displayName: 'Tooltip' };
