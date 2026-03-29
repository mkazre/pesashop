import React from 'react';
import BlockWrapper from './BlockWrapper';
import ProductCard from './ProductCard';
import { useBlockProducts, useProductBadges } from './useBlockProducts';
import { getCardStyleProps } from './blockStyles';

function ProductColumn({ column, cardProps }) {
  const { data: products = [], isLoading } = useBlockProducts(column.source, {
    categoryId: column.categoryId,
    limit: column.limit || 3,
  });
  const { data: badgeMap = {} } = useProductBadges(products);

  return (
    <div>
      <h4 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2" style={{ borderColor: cardProps.primaryColor }}>
        {column.title || 'Products'}
      </h4>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(column.limit || 3)].map((_, i) => (
            <div key={i} className="flex gap-3"><div className="w-16 h-16 bg-gray-100 rounded animate-pulse" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" /><div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" /></div></div>
          ))}
        </div>
      ) : (
        <div>
          {products.map(product => (
            <ProductCard key={product._id} product={product} compact showRating badges={badgeMap[product._id] || []} {...cardProps} />
          ))}
          {!products.length && <p className="text-sm text-gray-400 py-4">No products</p>}
        </div>
      )}
    </div>
  );
}

export default function ProductColumnsGrid({ block }) {
  const columns = block.columns || [];
  if (!columns.length) return null;
  const cardProps = getCardStyleProps(block);

  const colCount = columns.length;
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[colCount] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <BlockWrapper block={block}>
      <div className={`grid ${gridCols} gap-6`}>
        {columns.map((col, i) => (
          <ProductColumn key={i} column={col} cardProps={cardProps} />
        ))}
      </div>
    </BlockWrapper>
  );
}
