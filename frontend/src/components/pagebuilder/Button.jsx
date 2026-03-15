import React from 'react';
import { Link } from 'react-router-dom';
import { useDynamicProps } from './useDynamicProps';

/** View-only Button for page builder */
export const Button = (rawProps) => {
  const { text = 'Button', link, href, className = '', style = {}, size = 'md', variant = 'primary' } = useDynamicProps(rawProps);
  const resolvedLink = link || href || '#';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const variantClasses = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5',
  };
  const isInternal = resolvedLink && !resolvedLink.startsWith('http') && resolvedLink !== '#';
  const classes = `inline-block ${sizeClasses[size]} ${variantClasses[variant]} rounded transition-colors ${className}`;
  if (isInternal) {
    return (
      <Link to={resolvedLink} className={classes} style={style}>
        {text}
      </Link>
    );
  }
  return (
    <a href={resolvedLink} className={classes} style={style} target={resolvedLink?.startsWith('http') ? '_blank' : undefined} rel={resolvedLink?.startsWith('http') ? 'noopener noreferrer' : undefined}>
      {text}
    </a>
  );
};

Button.craft = { displayName: 'Button' };
