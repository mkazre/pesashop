import React, { useState } from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductCartButton = ({
  buttonText = 'Add to Cart',
  addedText = 'Added!',
  showQuantity = true,
  buttonColor = '#3b82f6',
  backgroundColor,
  textColor = '#ffffff',
  borderRadius = '8px',
  fullWidth = true,
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const bgColor = backgroundColor || buttonColor;

  const handleAdd = () => {
    // TODO: integrate with cart store using repeaterItem._id
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {showQuantity && (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius }}>
          <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>−</button>
          <span style={{ padding: '8px 12px', minWidth: '32px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>{qty}</span>
          <button onClick={() => setQty(qty + 1)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px' }}>+</button>
        </div>
      )}
      <button onClick={handleAdd} style={{ flex: fullWidth ? 1 : 'none', padding: '12px 28px', backgroundColor: added ? '#22c55e' : bgColor, color: textColor, border: 'none', borderRadius, cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'background-color 0.2s' }}>
        {added ? addedText : buttonText}
      </button>
    </div>
  );
};

ProductCartButton.craft = { displayName: 'Product Cart Button' };
