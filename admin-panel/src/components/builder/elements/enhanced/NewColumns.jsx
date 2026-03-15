import React from 'react';
import { useNode, Element } from '@craftjs/core';
import { NewColumnsSettings } from './NewColumnsSettings';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { Column } from './Column';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

// Preset width ratios
const WIDTH_PRESETS = {
  '50-50': ['50%', '50%'],
  '33-33-33': ['33.333%', '33.333%', '33.333%'],
  '25-25-25-25': ['25%', '25%', '25%', '25%'],
  '60-40': ['60%', '40%'],
  '40-60': ['40%', '60%'],
  '70-30': ['70%', '30%'],
  '30-70': ['30%', '70%'],
  '25-50-25': ['25%', '50%', '25%'],
  '25-75': ['25%', '75%'],
  '75-25': ['75%', '25%'],
  '20-60-20': ['20%', '60%', '20%'],
  '20-20-20-20-20': ['20%', '20%', '20%', '20%', '20%'],
};

export { WIDTH_PRESETS };

export const NewColumns = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { columns = 2, columnWidths, gap = '16px', stackOn = 'mobile', responsiveProps = {}, className = '', style = {} } = resolved;

  const { breakpoint } = useBreakpoint();
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    linkedNodes,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
    linkedNodes: state.data.linkedNodes || {},
  }));

  // Read responsive overrides for the current breakpoint
  const bpOverrides = (breakpoint !== 'desktop' && responsiveProps[breakpoint]) || {};
  const effectiveColumnWidths = bpOverrides.columnWidths || columnWidths;
  const effectiveGap = bpOverrides.gap || gap;

  // Determine if we should stack based on the current breakpoint
  // Only apply stackOn if there's no explicit responsive columnWidths override
  const hasResponsiveOverride = !!bpOverrides.columnWidths;
  const shouldStack = !hasResponsiveOverride && (
    (stackOn === 'mobile' && breakpoint === 'phone') ||
    (stackOn === 'tablet' && (breakpoint === 'phone' || breakpoint === 'tablet'))
  );

  // How many linked column nodes actually exist in the Craft.js tree
  const existingCount = Object.keys(linkedNodes).length;
  const renderCount = Math.min(columns, Math.max(existingCount, columns));

  // Build CSS Grid template from column widths
  let gridCols;
  if (shouldStack) {
    gridCols = '1fr';
  } else if (effectiveColumnWidths && effectiveColumnWidths.startsWith('repeat(')) {
    // Direct CSS Grid repeat() value from responsive presets (e.g. "repeat(2,1fr)")
    gridCols = effectiveColumnWidths;
  } else {
    // Parse comma-separated percentages (desktop widths)
    const widths = effectiveColumnWidths
      ? effectiveColumnWidths.split(',').map(w => w.trim())
      : Array(renderCount).fill(`${(100 / renderCount).toFixed(3)}%`);
    const allFullWidth = widths.every(w => w === '100%');
    gridCols = allFullWidth
      ? '1fr'
      : widths.map(w => {
          const num = parseFloat(w);
          return (!isNaN(num) && w.endsWith('%')) ? `${num}fr` : w;
        }).join(' ');
  }

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: gridCols,
    gap: effectiveGap,
    width: '100%',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`new-columns ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={containerStyle}
    >
      {Array.from({ length: renderCount }).map((_, i) => (
        <div key={`col-wrap-${i}`} style={{ minWidth: 0, overflow: 'hidden' }}>
          <Element
            id={`col-${i}`}
            is={Column}
            canvas
          />
        </div>
      ))}
    </div>
  );
};

NewColumns.craft = {
  displayName: 'Columns',
  props: {
    columns: 2,
    columnWidths: '50%,50%',
    gap: '16px',
    stackOn: 'mobile',
    responsiveProps: {},
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false, // Don't drop directly into Columns — drop into Column children
    canMoveOut: () => true,
  },
  isCanvas: false, // Not a canvas itself — the Column children are canvases
  related: {
    settings: NewColumnsSettings,
  },
};

export default NewColumns;
