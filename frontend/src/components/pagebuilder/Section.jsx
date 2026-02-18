import React from 'react';

/** View-only Section for page builder (no useNode) */
export const Section = ({ children, className = '', style = {} }) => {
  const formatSpacing = (spacing) => {
    if (!spacing) return undefined;
    if (typeof spacing === 'string') return spacing;
    if (typeof spacing === 'object') {
      const { top = 0, right = 0, bottom = 0, left = 0 } = spacing;
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }
    return undefined;
  };
  // Strip non-CSS keys before spreading
  const { responsive, responsiveProps, badge, ...cleanStyle } = style || {};
  const computedStyle = {
    ...cleanStyle,
    padding: formatSpacing(cleanStyle?.padding),
    margin: formatSpacing(cleanStyle?.margin),
  };
  const { customCSS, ...restStyle } = computedStyle;
  return (
    <section className={`section relative w-full ${className}`} style={restStyle}>
      <div className="section-inner-wrap w-full max-w-full">
        {children}
      </div>
      {customCSS && <style dangerouslySetInnerHTML={{ __html: customCSS }} />}
    </section>
  );
};

Section.craft = { displayName: 'Section' };
