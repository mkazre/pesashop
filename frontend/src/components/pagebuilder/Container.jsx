import React from 'react';
import { useDynamicProps } from './useDynamicProps';

/** View-only Container for page builder (no useNode) */
export const Container = (rawProps) => {
  const { children, className = '', style = {} } = useDynamicProps(rawProps);
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
    ...style,
    padding: formatSpacing(style?.padding),
    margin: formatSpacing(style?.margin),
  };
  const { customCSS, ...restStyle } = computedStyle;
  return (
    <div className={className || undefined} style={{ minWidth: 0, overflowWrap: 'break-word', wordWrap: 'break-word', ...restStyle }}>
      {children}
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
    </div>
  );
};

Container.craft = { displayName: 'Container' };
