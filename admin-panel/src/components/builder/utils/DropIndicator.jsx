import React from 'react';

// Visual indicator for drop zones
export const DropIndicator = ({ isOver, canDrop }) => {
  if (!isOver && !canDrop) return null;

  return (
    <div
      className={`absolute inset-0 border-2 border-dashed transition-all ${
        isOver && canDrop
          ? 'border-blue-500 bg-blue-50 bg-opacity-50'
          : canDrop
          ? 'border-blue-300 bg-blue-50 bg-opacity-30'
          : 'border-gray-300'
      }`}
      style={{ pointerEvents: 'none', zIndex: 1000 }}
    />
  );
};
