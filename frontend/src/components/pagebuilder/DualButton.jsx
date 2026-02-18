import React from 'react';

export const DualButton = ({
  button1Text = 'Primary',
  button1Url = '#',
  button1Color = '#3b82f6',
  button1TextColor = '#ffffff',
  button2Text = 'Secondary',
  button2Url = '#',
  button2Color = 'transparent',
  button2TextColor = '#3b82f6',
  gap = '12px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ display: 'flex', gap, alignItems: 'center', flexWrap: 'wrap', ...style }}>
    <a href={button1Url} style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: button1Color, color: button1TextColor, borderRadius, border: 'none', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{button1Text}</a>
    <a href={button2Url} style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: button2Color, color: button2TextColor, borderRadius, border: `2px solid ${button2TextColor}`, textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{button2Text}</a>
  </div>
);

DualButton.craft = { displayName: 'Dual Button' };
