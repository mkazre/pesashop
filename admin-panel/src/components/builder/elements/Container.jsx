import React from 'react';
import { useNode } from '@craftjs/core';
import { Square } from 'lucide-react';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { useResponsiveStyles } from '@/components/builder/utils/ResponsiveControls';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Container = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { children, className = '', style = {} } = resolved;

  const { breakpoint } = useBreakpoint();
  const { getCurrentStyles } = useResponsiveStyles(style, breakpoint);
  
  const {
    connectors: { connect, drag },
    selected,
    hovered,
    id,
    parent,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
    id: state.id,
    parent: state.data.parent,
  }));

  // Simple nesting indicator (shows if component has a parent)
  const isNested = !!parent;

  // Get responsive styles for current breakpoint
  const responsiveStyle = getCurrentStyles();

  // Convert padding/margin objects to CSS strings
  const formatSpacing = (spacing) => {
    if (!spacing) return undefined;
    if (typeof spacing === 'string') return spacing;
    if (typeof spacing === 'object') {
      const { top = 0, right = 0, bottom = 0, left = 0 } = spacing;
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }
    return undefined;
  };

  const computedStyle = {
    ...responsiveStyle,
    padding: formatSpacing(responsiveStyle?.padding),
    margin: formatSpacing(responsiveStyle?.margin),
  };

  // Remove customCSS from style and apply it separately if needed
  const { customCSS, ...restStyle } = computedStyle;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`container relative ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''} ${
        isNested ? 'border-l-2 border-blue-200' : ''
      }`}
      style={restStyle}
      title={isNested ? 'Nested Container' : 'Container'}
    >
      {isNested && (
        <div className="absolute top-0 left-0 bg-blue-100 text-blue-700 text-xs px-1 rounded-br z-10">
          Nested
        </div>
      )}
      {children}
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Container'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
  isCanvas: true, // This allows the element to contain other elements
};
