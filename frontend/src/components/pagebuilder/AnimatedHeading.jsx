import React from 'react';

export const AnimatedHeading = ({
  text = 'Animated Heading',
  className = '',
  style = {},
}) => (
  <h2 className={className} style={{ fontSize: '32px', fontWeight: 700, ...style }}>
    {text}
  </h2>
);

AnimatedHeading.craft = { displayName: 'Animated Heading' };
