import React, { useState } from 'react';

export const CopyToClipboard = ({
  text = 'Text to copy',
  buttonText = 'Copy',
  copiedText = 'Copied!',
  buttonColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      <code style={{ flex: 1, padding: '10px 14px', backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</code>
      <button onClick={handleCopy} style={{ padding: '10px 16px', backgroundColor: copied ? '#22c55e' : buttonColor, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', transition: 'background-color 0.2s' }}>
        {copied ? copiedText : buttonText}
      </button>
    </div>
  );
};

CopyToClipboard.craft = { displayName: 'Copy to Clipboard' };
