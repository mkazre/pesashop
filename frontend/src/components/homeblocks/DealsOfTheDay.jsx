import React, { useState, useEffect } from 'react';
import BlockWrapper from './BlockWrapper';
import ProductCard from './ProductCard';
import { useBlockProducts, useProductBadges } from './useBlockProducts';
import { getCardStyleProps } from './blockStyles';

function CountdownTimer({ endDate, primaryColor = '#0F604B' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex gap-2">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center text-white rounded-lg px-3 py-2 min-w-[52px]" style={{ backgroundColor: primaryColor }}>
          <span className="text-lg font-bold leading-tight">{pad(item.value)}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-80">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DealsOfTheDay({ block }) {
  const cardProps = getCardStyleProps(block);
  const { data: products = [], isLoading } = useBlockProducts(block.productSource || 'sale', {
    limit: block.productLimit || 4,
  });
  const { data: badgeMap = {} } = useProductBadges(products);

  return (
    <BlockWrapper block={block}>
      {/* Countdown */}
      {block.showCountdown && block.dealsEndDate && (
        <div className="mb-6">
          <CountdownTimer endDate={block.dealsEndDate} primaryColor={block.primaryColor || '#0F604B'} />
        </div>
      )}

      {/* Products */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(block.productLimit || 4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              showAddToCart={block.showAddToCart !== false}
              showRating={block.showRating !== false}
              badges={badgeMap[product._id] || []}
              {...cardProps}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No deals available</div>
      )}
    </BlockWrapper>
  );
}
