import React from 'react';
import { useNode } from '@craftjs/core';
import { Layout } from 'lucide-react';
import { canElementContainChildren } from '@/components/builder/utils/NestingRules';
import { useBreakpoint } from '@/components/builder/context/BreakpointContext';
import { useResponsiveStyles } from '@/components/builder/utils/ResponsiveControls';

export const Section = ({ children, className = '', style = {} }) => {
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
  const { customCSS, ...restStyle } = computedStyle;

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      data-craft-id={id}
      className={`section relative w-full ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={restStyle}
      title="Section"
    >
      <div className="section-inner-wrap w-full max-w-full">
        {children}
      </div>
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
    </section>
  );
};

Section.craft = {
  displayName: 'Section',
  props: {
    className: '',
    style: {},
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => canElementContainChildren('Section'), // Dynamic check based on nesting rules
    canMoveOut: () => true,
  },
  isCanvas: true, // This allows the element to contain other elements
};
