import React from 'react';

export const CSSGrid = ({ children, className = '', style = {} }) => {
  const { columns = 3, templateColumns, gap = '16px', templateRows, responsive, responsiveProps, badge, ...restStyle } = style;
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: templateColumns || `repeat(${columns}, 1fr)`, gridTemplateRows: templateRows || undefined, gap, ...restStyle }}>
      {children}
    </div>
  );
};

CSSGrid.craft = { displayName: 'CSS Grid' };
