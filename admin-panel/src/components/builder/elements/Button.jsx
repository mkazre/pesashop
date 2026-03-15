import React from 'react';
import { useNode } from '@craftjs/core';
import { Square } from 'lucide-react';
import { useDynamicProps } from '@/components/builder/utils/useDynamicProps';

export const Button = (rawProps) => {
  const resolved = useDynamicProps(rawProps);
  const { text = 'Button', link, href, className = '', style = {}, size = 'md', variant = 'primary' } = resolved;
  const resolvedLink = link || href || '#';
  const {
    connectors: { connect, drag },
    selected,
    hovered,
  } = useNode((state) => ({
    selected: state.events.selected,
    hovered: state.events.hovered,
  }));

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <a
      ref={(ref) => connect(drag(ref))}
      href={resolvedLink}
      className={`button inline-block ${sizeClasses[size]} ${variantClasses[variant]} rounded transition-colors ${className} ${
        selected ? 'ring-2 ring-blue-500' : ''
      } ${hovered ? 'ring-2 ring-blue-300' : ''}`}
      style={style}
      onClick={(e) => e.preventDefault()}
    >
      {text}
    </a>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Button',
    link: '#',
    className: '',
    style: {},
    size: 'md',
    variant: 'primary',
    dynamicBindings: {},
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false, // Button cannot contain other components
    canMoveOut: () => true,
  },
};
