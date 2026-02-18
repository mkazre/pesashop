import React from 'react';
import { useNode } from '@craftjs/core';
import { Square } from 'lucide-react';
import { DivBlockSettings } from './DivBlockSettings';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { useResponsiveStyles } from '@/components/builder/utils/ResponsiveControls';

export const DivBlock = ({ children, className = '', style = {} }) => {
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

  const responsiveStyle = getCurrentStyles();

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`div-block ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={{
        ...responsiveStyle,
        display: responsiveStyle.display || 'block',
        width: responsiveStyle.width || 'auto',
        height: responsiveStyle.height || 'auto'
      }}
    >
      {children}
    </div>
  );
};

DivBlock.craft = {
  displayName: 'Div Block',
  props: {
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Div Block'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
  isCanvas: true, // This allows the element to contain other elements
  related: {
    settings: DivBlockSettings,
  },
};

export default DivBlock;
