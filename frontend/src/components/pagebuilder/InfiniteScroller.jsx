import React from 'react';

export const InfiniteScroller = ({
  items = ['Item 1 ★', 'Item 2 ★', 'Item 3 ★', 'Item 4 ★', 'Item 5 ★'],
  speed = 30,
  direction = 'left',
  gap = '48px',
  fontSize = '16px',
  color = '#374151',
  className = '',
  style = {},
}) => {
  const content = items.join('  •  ');
  return (
    <div className={className} style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}>
      <div style={{ display: 'inline-block', fontSize, color, animation: `scroll-${direction} ${speed}s linear infinite`, paddingRight: gap }}>
        {content}  •  {content}
      </div>
      <style>{`@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } @keyframes scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }`}</style>
    </div>
  );
};

InfiniteScroller.craft = { displayName: 'Infinite Scroller' };
