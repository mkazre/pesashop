import React from 'react';
import { useRepeaterItem } from './RepeaterContext';
import { usePageData } from './PageDataContext';

export const ProductPrice = ({
  price = '$49.99',
  salePrice = '$39.99',
  showSale = true,
  priceColor = '#111827',
  salePriceColor = '#ef4444',
  originalPriceColor = '#9ca3af',
  fontSize = '24px',
  className = '',
  style = {},
}) => {
  const repeaterItem = useRepeaterItem();
  const pageData = usePageData();
  const product = repeaterItem || pageData?.product;

  const displayPrice = product ? `R ${(product.regularPrice || 0).toFixed(2)}` : price;
  const displaySalePrice = product?.salePrice ? `R ${product.salePrice.toFixed(2)}` : salePrice;
  const hasSale = product
    ? (product.salePrice && product.salePrice < product.regularPrice)
    : (showSale && salePrice);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {hasSale ? (
        <>
          <span style={{ fontSize, fontWeight: 700, color: salePriceColor }}>{displaySalePrice}</span>
          <span style={{ fontSize: `calc(${fontSize} * 0.75)`, color: originalPriceColor, textDecoration: 'line-through' }}>{displayPrice}</span>
        </>
      ) : (
        <span style={{ fontSize, fontWeight: 700, color: priceColor }}>{displayPrice}</span>
      )}
    </div>
  );
};

ProductPrice.craft = { displayName: 'Product Price' };
