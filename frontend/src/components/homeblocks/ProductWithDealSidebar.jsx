import React, { useState, useEffect } from 'react';
import BlockWrapper from './BlockWrapper';
import ProductCard from './ProductCard';
import { useBlockProducts } from './useBlockProducts';
import { useBlockBadges } from './useBlockBadges';
import { getCardStyleProps } from './blockStyles';

function CountdownTimer({ endDate }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <div className="flex gap-2 justify-center">
      {['days', 'hours', 'minutes', 'seconds'].map(unit => (
        <div key={unit} className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[48px]">
          <div className="text-lg font-bold">{String(time[unit]).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase opacity-70">{unit}</div>
        </div>
      ))}
    </div>
  );
}

export default function ProductWithDealSidebar({ block }) {
  const cardProps = getCardStyleProps(block);
  const { data: products = [], isLoading } = useBlockProducts(block.productSource || 'best-selling', {
    limit: block.productLimit || 10,
  });
  const { data: dealProducts = [] } = useBlockProducts(block.dealProductSource || 'featured', {
    limit: 1,
  });
  const { data: badges = [] } = useBlockBadges(block.badgeIds || [], block.showBadges !== false);

  const dealProduct = dealProducts[0];
  const dealOnRight = block.dealPosition !== 'left';

  const resolveImg = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };

  const productGrid = (
    <div className={`${dealOnRight ? 'order-1' : 'order-2'} flex-1 min-w-0`}>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              showAddToCart={block.showAddToCart !== false}
              showWishlist={block.showWishlist !== false}
              showRating={block.showRating !== false}
              badges={badges}
              {...cardProps}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No products found</div>
      )}
    </div>
  );

  const dealSidebar = block.dealEnabled !== false && dealProduct ? (
    <div
      className={`${dealOnRight ? 'order-2' : 'order-1'} w-full lg:w-80 flex-shrink-0`}
    >
      <div
        className="rounded-xl overflow-hidden h-full flex flex-col"
        style={{ backgroundColor: block.primaryColor || '#0F604B' }}
      >
        <div className="p-4 text-center text-white">
          <h3 className="text-lg font-bold">{block.dealTitle || 'Special Offer'}</h3>
        </div>
        <div className="bg-white flex-1 flex flex-col items-center px-4 py-6">
          {block.dealBadgeText && (
            <span
              className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: '#d32f2f' }}
            >
              {block.dealBadgeText}
            </span>
          )}
          {dealProduct.images?.[0] && (
            <img
              src={resolveImg(dealProduct.images[0])}
              alt={dealProduct.name}
              className="w-48 h-48 object-contain mb-4"
              loading="lazy"
            />
          )}
          <h4 className="font-semibold text-gray-800 text-center mb-2">{dealProduct.name}</h4>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold" style={{ color: block.priceColor || block.primaryColor || '#0F604B' }}>
              R{(dealProduct.salePrice || dealProduct.price || 0).toFixed(2)}
            </span>
            {dealProduct.salePrice && dealProduct.price > dealProduct.salePrice && (
              <del className="text-gray-400 text-sm">R{dealProduct.price.toFixed(2)}</del>
            )}
          </div>
          {block.showCountdown !== false && block.dealsEndDate && (
            <CountdownTimer endDate={block.dealsEndDate} />
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <BlockWrapper block={block}>
      <div className="flex flex-col lg:flex-row gap-6">
        {productGrid}
        {dealSidebar}
      </div>
    </BlockWrapper>
  );
}
