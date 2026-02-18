import React from 'react';

/** View-only PriceDisplay for page builder */
export const PriceDisplay = ({ price, className = '' }) => (
  <span className={`font-semibold ${className}`}>
    {price != null ? `R ${Number(price).toFixed(2)}` : '—'}
  </span>
);

PriceDisplay.craft = { displayName: 'PriceDisplay' };
