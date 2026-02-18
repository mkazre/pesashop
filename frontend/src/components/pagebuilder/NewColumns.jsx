import React from 'react';
import { useNode, Element } from '@craftjs/core';
import { Column } from './Column';

const COLUMNS_MEDIA = {
  tablet: '@media (max-width: 1024px)',
  phone: '@media (max-width: 767px)',
};

/** Convert a comma-separated width string to CSS Grid fr units */
const widthsToGridCols = (widthStr, count) => {
  const widths = widthStr
    ? widthStr.split(',').map(w => w.trim())
    : Array(count).fill(`${(100 / count).toFixed(3)}%`);
  const allFull = widths.every(w => w === '100%');
  if (allFull) return '1fr';
  return widths.map(w => {
    const num = parseFloat(w);
    return (!isNaN(num) && w.endsWith('%')) ? `${num}fr` : w;
  }).join(' ');
};

export const NewColumns = ({ columns = 2, columnWidths, gap = '16px', stackOn = 'mobile', responsiveProps: rp = {}, className = '', style = {} }) => {
  const {
    connectors: { connect },
    id,
    linkedNodes,
  } = useNode((state) => ({
    linkedNodes: state.data.linkedNodes || {},
  }));

  // How many linked column nodes actually exist
  const existingCount = Object.keys(linkedNodes).length;
  const renderCount = Math.min(columns, Math.max(existingCount, columns));

  // Build CSS Grid template from desktop column widths
  const desktopGridCols = widthsToGridCols(columnWidths, renderCount);

  // Strip non-CSS keys before spreading
  const { responsive, responsiveProps: _rp, badge, ...cleanStyle } = style || {};
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: desktopGridCols,
    gap,
    width: '100%',
    ...cleanStyle,
  };

  // Build responsive CSS for tablet/mobile overrides
  const cssRules = [];
  const elSelector = `[data-nc-id="${id}"]`;

  // stackOn legacy support via CSS (only if no explicit responsiveProps override for that breakpoint)
  if (stackOn === 'mobile' && !rp.phone?.columnWidths) {
    cssRules.push(`@media (max-width: 767px) { ${elSelector} { grid-template-columns: 1fr !important; } }`);
  } else if (stackOn === 'tablet') {
    if (!rp.tablet?.columnWidths) cssRules.push(`@media (max-width: 1024px) { ${elSelector} { grid-template-columns: 1fr !important; } }`);
    if (!rp.phone?.columnWidths) cssRules.push(`@media (max-width: 767px) { ${elSelector} { grid-template-columns: 1fr !important; } }`);
  }

  // responsiveProps overrides (these take priority over stackOn)
  for (const [bp, mq] of Object.entries(COLUMNS_MEDIA)) {
    const overrides = rp[bp];
    if (!overrides) continue;
    const rules = [];
    if (overrides.columnWidths) {
      // If it's already a CSS repeat() value, use it directly; otherwise parse as comma-separated widths
      const gridCols = overrides.columnWidths.startsWith('repeat(')
        ? overrides.columnWidths
        : widthsToGridCols(overrides.columnWidths, renderCount);
      rules.push(`grid-template-columns: ${gridCols} !important`);
    }
    if (overrides.gap) {
      rules.push(`gap: ${overrides.gap} !important`);
    }
    if (rules.length > 0) {
      cssRules.push(`${mq} { ${elSelector} { ${rules.join('; ')}; } }`);
    }
  }

  return (
    <div ref={connect} data-nc-id={id} className={className} style={containerStyle}>
      {Array.from({ length: renderCount }).map((_, i) => (
        <div key={`col-wrap-${i}`} style={{ minWidth: 0, overflow: 'hidden' }}>
          <Element id={`col-${i}`} is={Column} canvas />
        </div>
      ))}
      {cssRules.length > 0 && <style dangerouslySetInnerHTML={{ __html: cssRules.join('\n') }} />}
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
  },
  isCanvas: false,
};
