import React from 'react';
import { useNode } from '@craftjs/core';

/**
 * Column — frontend render component for individual column cells inside NewColumns.
 * Mirrors the admin-panel Column component but without Craft.js editor features.
 * Must use useNode + connect so Craft.js can wire up the canvas and render children.
 */
export const Column = ({ children, className = '', style = {} }) => {
  const {
    connectors: { connect },
  } = useNode();

  const { responsive, responsiveProps, badge, ...cleanStyle } = style || {};
  return (
    <div ref={connect} className={className} style={{ minHeight: 0, ...cleanStyle }}>
      {children}
    </div>
  );
};

Column.craft = {
  displayName: 'Column',
  props: { className: '', style: {} },
  isCanvas: true,
};

export default Column;
