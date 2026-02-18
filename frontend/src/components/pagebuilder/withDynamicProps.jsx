import React from 'react';
import { useDynamicProps } from './useDynamicProps';

/**
 * withDynamicProps — Higher-order component that wraps any page builder element
 * to automatically resolve dynamic data bindings and clean non-CSS keys from style.
 *
 * This ensures ALL elements (not just the 10 that manually call useDynamicProps)
 * properly resolve {{product.name}}, {{category.name}}, etc. when placed inside
 * a Repeater or any other dynamic data context.
 *
 * @param {React.ComponentType} Component - The element component to wrap
 * @returns {React.ComponentType} - Wrapped component with dynamic data resolution
 */
export function withDynamicProps(Component) {
  const Wrapped = (rawProps) => {
    const resolvedProps = useDynamicProps(rawProps);
    return <Component {...resolvedProps} />;
  };

  // Preserve the original component's displayName and craft config
  const name = Component.displayName || Component.name || 'Component';
  Wrapped.displayName = name;
  if (Component.craft) {
    Wrapped.craft = Component.craft;
  }

  return Wrapped;
}

export default withDynamicProps;
