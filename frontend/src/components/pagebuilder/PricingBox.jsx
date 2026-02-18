import React from 'react';

export const PricingBox = ({
  title = 'Pro Plan',
  price = '$29',
  period = '/month',
  features = ['Feature 1', 'Feature 2', 'Feature 3'],
  buttonText = 'Get Started',
  buttonUrl = '#',
  highlighted = false,
  accentColor = '#3b82f6',
  className = '',
  style = {},
}) => (
  <div className={className} style={{ padding: '32px 24px', borderRadius: '12px', border: highlighted ? `2px solid ${accentColor}` : '1px solid #e5e7eb', backgroundColor: '#fff', textAlign: 'center', position: 'relative', ...style }}>
    {highlighted && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: accentColor, color: '#fff', padding: '2px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Popular</div>}
    <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>{title}</h3>
    <div style={{ margin: '16px 0' }}>
      <span style={{ fontSize: '40px', fontWeight: 700, color: accentColor }}>{price}</span>
      <span style={{ color: '#6b7280', fontSize: '14px' }}>{period}</span>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', textAlign: 'left' }}>
      {features.map((f, i) => (
        <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: accentColor }}>&#10003;</span> {f}
        </li>
      ))}
    </ul>
    <a href={buttonUrl} style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: highlighted ? accentColor : 'transparent', color: highlighted ? '#fff' : accentColor, border: `2px solid ${accentColor}`, borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
      {buttonText}
    </a>
  </div>
);

PricingBox.craft = { displayName: 'Pricing Box' };
