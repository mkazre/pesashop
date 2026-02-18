import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export const ProductRating = ({
  rating = 4.5,
  reviewCount = 128,
  showCount = true,
  starSize = '18px',
  activeColor = '#fbbf24',
  inactiveColor = '#d1d5db',
  textColor = '#6b7280',
  className = '',
  style = {},
}) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div ref={(ref) => connect(drag(ref))} className={`product-rating ${className} ${selected ? 'ring-2 ring-blue-500' : ''} ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', ...style }}>
      <div style={{ display: 'flex', gap: '1px' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ fontSize: starSize, color: i < fullStars ? activeColor : (i === fullStars && hasHalf ? activeColor : inactiveColor), lineHeight: 1 }}>
            {i < fullStars ? '★' : (i === fullStars && hasHalf ? '★' : '☆')}
          </span>
        ))}
      </div>
      {showCount && <span style={{ fontSize: '13px', color: textColor }}>({reviewCount} reviews)</span>}
    </div>
  );
};

export const ProductRatingSettings = ({ nodeId }) => {
  const props = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor((state) => state.actions);
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const { rating = 4.5, reviewCount = 128, showCount = true, starSize = '18px', activeColor = '#fbbf24' } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Rating</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Rating (0-5)</label><input type="number" min={0} max={5} step={0.5} value={rating} onChange={(e) => setProp((p) => { p.rating = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Review Count</label><input type="number" value={reviewCount} onChange={(e) => setProp((p) => { p.reviewCount = Number(e.target.value); })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showCount} onChange={(e) => setProp((p) => { p.showCount = e.target.checked; })} />Show Review Count</label>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Star Size</label><input type="text" value={starSize} onChange={(e) => setProp((p) => { p.starSize = e.target.value; })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Star Color</label><input type="color" value={activeColor} onChange={(e) => setProp((p) => { p.activeColor = e.target.value; })} className="w-full h-8 border border-gray-300 rounded-md" /></div>
        </div>
      </div>
    </div>
  );
};

ProductRating.craft = {
  displayName: 'Product Rating',
  props: { rating: 4.5, reviewCount: 128, showCount: true, starSize: '18px', activeColor: '#fbbf24', inactiveColor: '#d1d5db', textColor: '#6b7280', className: '', style: {},
    dynamicBindings: {},
  },
  rules: { canDrag: () => true, canMoveIn: () => false, canMoveOut: () => true },
};
