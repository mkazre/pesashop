import React from 'react';
import { useNode } from '@craftjs/core';

/**
 * Column — a single column cell inside NewColumns.
 * Each Column is its own Craft.js canvas, so it acts as an independent drop zone.
 */
export const Column = ({ children, className = '', style = {} }) => {
  const {
    connectors: { connect },
    selected,
    hovered,
    id,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const isEmpty = React.Children.count(children) === 0;

  return (
    <div
      ref={connect}
      data-craft-id={id}
      className={`craft-column ${className} ${
        selected ? 'outline-2 outline outline-blue-500' : ''
      } ${hovered && !selected ? 'outline-2 outline-dashed outline-blue-300' : ''}`}
      style={{
        minHeight: '60px',
        position: 'relative',
        ...style,
      }}
    >
      {children}
      {isEmpty && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '60px',
          border: '2px dashed #d1d5db',
          borderRadius: '6px',
          color: '#9ca3af',
          fontSize: '11px',
          pointerEvents: 'none',
        }}>
          Drop here
        </div>
      )}
    </div>
  );
};

Column.craft = {
  displayName: 'Column',
  props: {
    className: '',
    style: {},
  },
  rules: {
    canDrag: () => false, // Columns can't be dragged individually
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  isCanvas: true,
};

export default Column;
