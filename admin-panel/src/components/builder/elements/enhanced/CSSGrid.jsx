import React, { useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Grid3x3 } from 'lucide-react';
import { NumberControl, ColorControl, SelectControl, Checkbox } from '@/components/builder/controls/PropertyControls';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { useResponsiveStyles } from '@/components/builder/utils/ResponsiveControls';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const CSSGrid = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { children, className = '', style = {} } = resolved;

  const { breakpoint } = useBreakpoint();
  const { getCurrentStyles } = useResponsiveStyles(style, breakpoint);
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
  }));

  const rs = getCurrentStyles();
  const {
    columns = 3,
    rows = 'auto',
    gap = '16px',
    columnGap = '16px',
    rowGap = '16px',
    justifyContent = 'start',
    alignContent = 'start',
    alignItems = 'start',
    justifyItems = 'start',
    autoFlow = 'row',
    autoColumns = 'auto',
    autoRows = 'auto',
    templateColumns = `repeat(${columns}, 1fr)`,
    templateRows = rows,
    backgroundColor = 'transparent',
    padding = '0px',
    margin = '0px'
  } = rs;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: templateColumns,
    gridTemplateRows: templateRows,
    gridAutoFlow: autoFlow,
    gridAutoColumns: autoColumns,
    gridAutoRows: autoRows,
    gap: gap,
    columnGap: columnGap,
    rowGap: rowGap,
    justifyContent: justifyContent,
    alignContent: alignContent,
    alignItems: alignItems,
    justifyItems: justifyItems,
    backgroundColor: backgroundColor,
    padding: padding,
    margin: margin,
    minHeight: '200px',
    border: selected ? '2px solid #3b82f6' : hovered ? '2px solid #93c5fd' : '1px dashed #d1d5db'
  };

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`css-grid ${className}`}
      style={gridStyle}
    >
      {children || (
        <div className="col-span-full row-span-full flex items-center justify-center text-gray-400 text-sm">
          <Grid3x3 size={16} className="mr-2" />
          CSS Grid Container
        </div>
      )}
    </div>
  );
};

// Settings Panel Component
export const CSSGridSettings = ({ nodeId }) => {
  const nodeProps = useEditor((state) => state.nodes[nodeId]?.data?.props ?? {});
  const { actions } = useEditor();
  const setProp = (cb) => actions.setProp(nodeId, cb);
  const {
    columns = 3,
    rows = 'auto',
    gap = '16px',
    columnGap = '16px',
    rowGap = '16px',
    justifyContent = 'start',
    alignContent = 'start',
    alignItems = 'start',
    justifyItems = 'start',
    autoFlow = 'row',
    autoColumns = 'auto',
    autoRows = 'auto',
    templateColumns = '',
    templateRows = '',
    backgroundColor = 'transparent',
    padding = '0px',
    margin = '0px',
    showGridLines = false,
    gridLineColor = '#e5e7eb'
  } = nodeProps;

  const justifyOptions = [
    { value: 'start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'end', label: 'End' },
    { value: 'stretch', label: 'Stretch' },
    { value: 'space-between', label: 'Space Between' },
    { value: 'space-around', label: 'Space Around' },
    { value: 'space-evenly', label: 'Space Evenly' }
  ];

  const alignOptions = [
    { value: 'start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'end', label: 'End' },
    { value: 'stretch', label: 'Stretch' }
  ];

  const autoFlowOptions = [
    { value: 'row', label: 'Row' },
    { value: 'column', label: 'Column' },
    { value: 'row dense', label: 'Row Dense' },
    { value: 'column dense', label: 'Column Dense' }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Grid Structure</h4>

        <NumberControl
          label="Columns"
          value={columns}
          onChange={(value) => {
            const newTemplateColumns = `repeat(${value}, 1fr)`;
            setProp((p) => { p.columns = value; p.templateColumns = newTemplateColumns; });
          }}
          min={1}
          max={12}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Template Columns</label>
          <input
            type="text"
            value={templateColumns}
            onChange={(e) => setProp((p) => { p.templateColumns = e.target.value; })}
            placeholder="repeat(3, 1fr) or 200px 1fr 2fr"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500">
            Use CSS grid-template-columns syntax
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Template Rows</label>
          <input
            type="text"
            value={templateRows}
            onChange={(e) => setProp((p) => { p.templateRows = e.target.value; })}
            placeholder="auto or 100px 200px auto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500">
            Use CSS grid-template-rows syntax
          </p>
        </div>

        <SelectControl
          label="Auto Flow"
          value={autoFlow}
          onChange={(value) => setProp((p) => { p.autoFlow = value; })}
          options={autoFlowOptions}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Auto Columns</label>
          <input
            type="text"
            value={autoColumns}
            onChange={(e) => setProp((p) => { p.autoColumns = e.target.value; })}
            placeholder="auto or 200px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Auto Rows</label>
          <input
            type="text"
            value={autoRows}
            onChange={(e) => setProp((p) => { p.autoRows = e.target.value; })}
            placeholder="auto or 200px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Spacing</h4>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Gap</label>
          <input
            type="text"
            value={gap}
            onChange={(e) => setProp((p) => { p.gap = e.target.value; })}
            placeholder="16px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500">
            Sets both row-gap and column-gap
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Column Gap</label>
          <input
            type="text"
            value={columnGap}
            onChange={(e) => setProp((p) => { p.columnGap = e.target.value; })}
            placeholder="16px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Row Gap</label>
          <input
            type="text"
            value={rowGap}
            onChange={(e) => setProp((p) => { p.rowGap = e.target.value; })}
            placeholder="16px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Padding</label>
          <input
            type="text"
            value={padding}
            onChange={(e) => setProp((p) => { p.padding = e.target.value; })}
            placeholder="16px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Margin</label>
          <input
            type="text"
            value={margin}
            onChange={(e) => setProp((p) => { p.margin = e.target.value; })}
            placeholder="16px"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Alignment</h4>

        <SelectControl
          label="Justify Content"
          value={justifyContent}
          onChange={(value) => setProp((p) => { p.justifyContent = value; })}
          options={justifyOptions}
        />

        <SelectControl
          label="Align Content"
          value={alignContent}
          onChange={(value) => setProp((p) => { p.alignContent = value; })}
          options={alignOptions}
        />

        <SelectControl
          label="Align Items"
          value={alignItems}
          onChange={(value) => setProp((p) => { p.alignItems = value; })}
          options={alignOptions}
        />

        <SelectControl
          label="Justify Items"
          value={justifyItems}
          onChange={(value) => setProp((p) => { p.justifyItems = value; })}
          options={alignOptions}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Appearance</h4>

        <ColorControl
          label="Background Color"
          value={backgroundColor}
          onChange={(value) => setProp((p) => { p.backgroundColor = value; })}
        />

        <Checkbox
          label="Show Grid Lines"
          checked={showGridLines}
          onChange={(checked) => setProp((p) => { p.showGridLines = checked; })}
        />

        {showGridLines && (
          <ColorControl
            label="Grid Line Color"
            value={gridLineColor}
            onChange={(value) => setProp((p) => { p.gridLineColor = value; })}
          />
        )}
      </div>

      {/* Grid Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">Grid Preview</div>
        <div 
          className="border border-gray-300 rounded p-2"
          style={{
            display: 'grid',
            gridTemplateColumns: templateColumns,
            gridTemplateRows: templateRows,
            gap: gap,
            minHeight: '60px'
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-blue-100 border border-blue-200 rounded flex items-center justify-center text-xs text-blue-600"
              style={{ minHeight: '20px' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Craft.js Configuration
CSSGrid.craft = {
  displayName: 'CSS Grid',
  props: {
    className: '',
    style: {
      columns: 3,
      rows: 'auto',
      gap: '16px',
      columnGap: '16px',
      rowGap: '16px',
      justifyContent: 'start',
      alignContent: 'start',
      alignItems: 'start',
      justifyItems: 'start',
      autoFlow: 'row',
      autoColumns: 'auto',
      autoRows: 'auto',
      templateColumns: 'repeat(3, 1fr)',
      templateRows: 'auto',
      backgroundColor: 'transparent',
      padding: '0px',
      margin: '0px',
      showGridLines: false,
      gridLineColor: '#e5e7eb'
    },
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  isCanvas: true,
  related: {
    settings: CSSGridSettings,
  },
};

export default CSSGrid;
