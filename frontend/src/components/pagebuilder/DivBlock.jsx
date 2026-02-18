import React from 'react';
import { useDynamicProps } from './useDynamicProps';

export const DivBlock = (rawProps) => {
  const { children, className = '', style = {} } = useDynamicProps(rawProps);
  return <div className={className} style={style}>{children}</div>;
};

DivBlock.craft = { displayName: 'Div Block' };
