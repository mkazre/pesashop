import React, { useState, useMemo } from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductTabs = ({
  tabs = [
    { label: 'Description', content: 'Full product description goes here with all the details about the product.' },
    { label: 'Additional Info', content: 'Weight: 1.5kg\nDimensions: 30 × 20 × 10 cm\nMaterial: Premium Cotton' },
    { label: 'Reviews', content: 'No reviews yet.' },
  ],
  activeColor = '#3b82f6',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;
  const [active, setActive] = useState(0);

  const displayTabs = useMemo(() => {
    if (!product) return tabs;
    const productTabs = [];
    if (product.description) productTabs.push({ label: 'Description', content: product.description });
    const infoLines = [];
    if (product.weight) infoLines.push(`Weight: ${product.weight}kg`);
    if (product.dimensions) infoLines.push(`Dimensions: ${product.dimensions}`);
    if (product.material) infoLines.push(`Material: ${product.material}`);
    if (product.brand) infoLines.push(`Brand: ${product.brand}`);
    if (infoLines.length > 0) productTabs.push({ label: 'Additional Info', content: infoLines.join('\n') });
    productTabs.push({ label: 'Reviews', content: product.reviewCount ? `${product.reviewCount} reviews` : 'No reviews yet.' });
    return productTabs.length > 0 ? productTabs : tabs;
  }, [product, tabs]);

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
        {displayTabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: '14px',
            fontWeight: active === i ? 600 : 400, background: 'transparent',
            color: active === i ? activeColor : '#6b7280',
            borderBottom: active === i ? `2px solid ${activeColor}` : '2px solid transparent',
            marginBottom: '-2px',
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ padding: '20px 0', fontSize: '14px', color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {displayTabs[active]?.content}
      </div>
    </div>
  );
};

ProductTabs.craft = { displayName: 'Product Tabs' };
